#!/usr/bin/env bash
# Diagnose the "Transaction numbers are only allowed on a replica set member
# or mongos" (MongoDB error code 20) failure from the WorkSphere backend.
#
# Run this on the machine where you are running workSphere-Backend:
#   bash scripts/diagnose-mongo-transactions.sh [path-to-backend-repo]
#
# It answers two questions, in order:
#   1. Is MongoDB a replica set (PRIMARY reachable)?
#   2. Does the URI the *running backend* actually uses point at that replica set?

set -uo pipefail

BACKEND_DIR="${1:-.}"
FAILED=0

pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAILED=1; }
info() { printf '  \033[36mINFO\033[0m  %s\n' "$1"; }
section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# ---------------------------------------------------------------------------
# 1. The URI the running backend actually loaded
# ---------------------------------------------------------------------------
section "1. MongoDB URI in use"

ENV_FILE=""
for candidate in "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.local" "$BACKEND_DIR/.env.development"; do
  if [ -f "$candidate" ]; then ENV_FILE="$candidate"; break; fi
done

if [ -n "${MONGODB_URI:-}" ]; then
  URI="$MONGODB_URI"
  info "Using MONGODB_URI from the shell environment (this takes precedence over any .env file)"
elif [ -n "$ENV_FILE" ]; then
  # Read without executing the file; only the MONGODB_URI line matters.
  URI="$(grep -E '^[[:space:]]*MONGODB_URI[[:space:]]*=' "$ENV_FILE" | tail -n1 | sed -E 's/^[^=]*=[[:space:]]*//; s/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/')"
  info "Read from $ENV_FILE"
else
  info "No .env file found in $BACKEND_DIR and MONGODB_URI is not exported"
fi

if [ -z "${URI:-}" ]; then
  fail "MONGODB_URI is not set anywhere. The backend falls back to"
  info "mongodb://127.0.0.1:27017/worksphere — a STANDALONE connection, which cannot run transactions."
else
  # Never print credentials.
  SAFE_URI="$(printf '%s' "$URI" | sed -E 's#^([a-z+]+)://[^@]*@#\1://***:***@#')"
  info "Effective URI: $SAFE_URI"

  case "$URI" in
    *replicaSet=*|*mongodb+srv://*)
      pass "URI requests a replica set (replicaSet= present, or an SRV/managed cluster URI)"
      ;;
    *)
      fail "URI has NO replicaSet parameter and is not an SRV URI"
      info "Add ?replicaSet=rs0 — a standalone connection cannot start a transaction."
      ;;
  esac
fi

# ---------------------------------------------------------------------------
# 2. Is the mongod it points at actually a replica set?
# ---------------------------------------------------------------------------
section "2. Live server topology"

if ! command -v mongosh >/dev/null 2>&1; then
  fail "mongosh is not installed, so the live topology cannot be checked"
  info "Install the MongoDB Shell, or check manually: rs.status() in mongosh"
else
  OUT="$(mongosh "${URI:-mongodb://127.0.0.1:27017/worksphere}" --quiet \
    --eval 'JSON.stringify({ok: db.adminCommand({hello:1}).ok, setName: db.adminCommand({hello:1}).setName || null, isWritablePrimary: !!db.adminCommand({hello:1}).isWritablePrimary})' \
    2>&1)"

  if printf '%s' "$OUT" | grep -q '"setName":"'; then
    pass "Server reports a replica set: $OUT"
  elif printf '%s' "$OUT" | grep -q '"setName":null'; then
    fail "Server is running STANDALONE (setName is null) — transactions are impossible"
    info "This is the cause. Convert it in place (no data loss):"
    info "  mongosh --eval 'rs.initiate()'"
    info "Then set MONGODB_URI=...?replicaSet=rs0 and RESTART the backend."
  else
    fail "Could not query the server:"
    printf '%s\n' "$OUT" | sed 's/^/        /'
    info "Is mongod running and reachable at this URI?"
  fi
fi

# ---------------------------------------------------------------------------
# 3. The trap most people hit
# ---------------------------------------------------------------------------
section "3. Is the backend actually running the config you just edited?"

PID=""
if command -v pgrep >/dev/null 2>&1; then
  for candidate in $(pgrep -f 'node' 2>/dev/null); do
    # Ignore this script and anything that is plainly not the API server.
    ARGS="$(ps -o args= -p "$candidate" 2>/dev/null)"
    case "$ARGS" in
      *diagnose-mongo*|*vitest*|*vite*|*eslint*) continue ;;
      *server.js*|*app.js*|*index.js*|*nodemon*|*workSphere*|*worksphere*) PID="$candidate"; break ;;
    esac
  done
fi

if [ -n "$PID" ]; then
  STARTED="$(ps -o lstart= -p "$PID" 2>/dev/null | xargs)"
  info "Backend process $PID started: ${STARTED:-unknown}"
  if [ -n "$ENV_FILE" ]; then
    CHANGED="$(date -r "$ENV_FILE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
    STARTED_TS="$(date -d "$STARTED" '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
    info ".env last modified: ${CHANGED:-unknown}"

    # A .env newer than the process means the process booted with stale values.
    if [ -n "$CHANGED" ] && [ -n "$STARTED_TS" ] && [[ "$CHANGED" > "$STARTED_TS" ]]; then
      fail "The .env was edited AFTER the backend started — it is still using the OLD config"
      info "Node reads .env once at boot. Restart the backend process now."
    else
      pass "The backend started after the last .env edit"
    fi
  fi
else
  info "No running backend process detected on this machine."
  info "If it runs elsewhere (another terminal, container, or host), restart it there —"
  info "MONGODB_URI is read once at boot and is never re-read at runtime."
fi

section "Result"
if [ "$FAILED" -eq 0 ]; then
  printf '  \033[32mAll checks passed.\033[0m If the API still fails, restart the backend and retry.\n'
else
  printf '  \033[31mAt least one check failed\033[0m — fix the FAIL lines above, then restart the backend.\n'
fi
exit "$FAILED"
