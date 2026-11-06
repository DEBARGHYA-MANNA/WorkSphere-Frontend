/**
 * In-memory access-token store.
 *
 * ── Security contract ─────────────────────────────────────────────────────────
 * The access token lives **only in memory**. It is never written to
 * localStorage, sessionStorage, IndexedDB, or a cookie readable by JavaScript.
 * A full page reload therefore loses it by design; the app re-mints it through
 * `POST /auth/refresh` using the backend's HttpOnly refresh cookie, which
 * JavaScript cannot read.
 *
 * The refresh token never touches this module at all — there is no API here to
 * store one, so it cannot be leaked by accident.
 * ──────────────────────────────────────────────────────────────────────────────
 */

let accessToken = null
/** Absolute epoch ms at which the current access token stops being valid. */
let expiresAt = null
const listeners = new Set()

function notify() {
  for (const listener of listeners) listener({ accessToken, expiresAt })
}

/**
 * Store a freshly issued access token.
 * @param {string|null} token
 * @param {number} [expiresInSeconds] backend `accessTokenExpiresIn` (e.g. "15m")
 */
export function setAccessToken(token, expiresInSeconds) {
  accessToken = token || null
  if (accessToken && Number.isFinite(Number(expiresInSeconds)) && Number(expiresInSeconds) > 0) {
    // Refresh one minute early so a request never races the expiry boundary.
    const ttlMs = Math.max(Number(expiresInSeconds) * 1000 - 60_000, 5_000)
    expiresAt = Date.now() + ttlMs
  } else {
    expiresAt = null
  }
  notify()
}

/** @returns {string|null} the current access token, if any. */
export function getAccessToken() {
  return accessToken
}

/** Absolute expiry (epoch ms) of the current token, or null when unknown. */
export function getAccessTokenExpiresAt() {
  return expiresAt
}

/**
 * True when there is no token, or the token is within its safety window of
 * expiry and should be refreshed before use.
 */
export function isAccessTokenExpired() {
  if (!accessToken) return true
  if (!expiresAt) return false
  return Date.now() >= expiresAt
}

/** Clear the token (sign-out, failed refresh, session revocation). */
export function clearAccessToken() {
  accessToken = null
  expiresAt = null
  notify()
}

/** Subscribe to token changes. Returns an unsubscribe function. */
export function subscribeToAccessToken(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Test-only reset. Kept as an explicit export (rather than relying on module
 * reloads) so specs can isolate state deterministically.
 */
export function __resetTokenStoreForTests() {
  accessToken = null
  expiresAt = null
}
