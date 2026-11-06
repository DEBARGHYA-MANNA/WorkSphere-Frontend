# API Integration

Source of truth: the **backend OpenAPI document** (`GET /openapi.json`, Swagger UI at `/api-docs`)
and `docs/API_DOCUMENTATION.md` in the
[backend repository](https://github.com/DEBARGHYA-MANNA/WorkSphere-Backend). Every path, query
parameter, enum, and response field used by this client is taken from that contract. Nothing is
invented; where a capability does not exist, the UI documents the dependency instead of faking it.

## Base URL and proxy

The browser calls a **same-origin relative path**, not an absolute API host:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:3000   # dev server only, never shipped
```

`vite.config.js` proxies `/api` → `VITE_API_PROXY_TARGET`. In production the reverse proxy performs
the same forwarding. Benefits:

- The HttpOnly refresh cookie stays **first-party** (no CORS credentials, no `SameSite=None`).
- No environment-specific API host leaks into the bundle.
- Sandbox previews work because nothing calls `localhost` from browser code.

If the API is ever served from another origin, set `VITE_API_BASE_URL` to that absolute URL and the
backend must enable CORS with credentials for this origin.

## Response envelope

Success:

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [{ "…": "…" }],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "requestId": "…"
}
```

Error:

```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "message": "title must be at least 2 characters", "field": "title", "type": "string.min" }
    ]
  },
  "requestId": "…"
}
```

Handling lives in `src/services/http/envelope.js`:

- `unwrap(body)` — returns `data` when the object is an envelope, otherwise the body unchanged.
- `extractPagination(body)` — reads `pagination` (falling back to `meta.pagination`).
- `extractEnvelopeMessage(body)` — reads `message`, `error.message`, or the first `errors[]` entry.
- `extractFieldErrors(body)` — maps `error.details[]` → `{ field: message }` for form errors.
- `extractList(body)` — always returns an array (handles `items`, `results`, `records`, `rows`).

## Authentication flow

```text
POST /auth/register   → 201 { data: { user, emailVerificationRequired } }
POST /auth/login      → 200 { data: { accessToken, tokenType, accessTokenExpiresIn, user } }
                         + Set-Cookie: worksphereRefreshToken (HttpOnly, Path=/api/v1/auth)
POST /auth/refresh    → 200 { data: { accessToken, … } }   (rotates the cookie)
POST /auth/logout     → 200 { data: null }                 (revokes session, clears cookie)
POST /auth/logout-all → 200 { data: { revokedSessions } }
```

- The **access token is kept in memory only** and attached as `Authorization: Bearer <token>`.
- The **refresh token is never visible to JavaScript** — it is an HttpOnly cookie scoped to
  `/api/v1/auth`. `withCredentials: true` is required on refresh/logout.
- On a `401`, the client refreshes **once** and replays the failed requests through a single-flight
  queue. Concurrent 401s share one refresh promise.
- A failed refresh clears the session and routes to `/login?redirect=<safe-internal-path>`; the
  redirect target is validated to be an internal path (no open redirects).
- A refresh token is rotated on every use; the backend detects reuse and revokes the session, which
  the client surfaces as a normal sign-out.

### Email verification

`EMAIL_VERIFICATION_ENABLED=false` by default on the backend. The register response therefore
returns `data.emailVerificationRequired: false` and login succeeds immediately. The client:

- reads `emailVerificationRequired` from the response instead of assuming;
- shows the "check your email" screen **only** when the flag is `true`;
- keeps `POST /auth/verify-email` and `POST /auth/resend-verification` wired for when a mail
  transport is configured. No token is ever expected in an API response.

### Verified against the backend implementation

| Detail              | Value                                                                              | Source                             |
| ------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Refresh cookie name | `worksphereRefreshToken`                                                           | `src/modules/auth/auth.cookies.js` |
| Cookie scope        | `Path=/api/v1/auth`, `HttpOnly`, `SameSite=lax` (default), `Secure` in production  | same                               |
| Login response      | `{ accessToken, tokenType: 'Bearer', accessTokenExpiresIn, user }`                 | `auth.controller.js`               |
| Register response   | `{ user, emailVerificationRequired }` (201)                                        | same                               |
| Invalid credentials | `401 { error: { code: 'INVALID_CREDENTIALS' } }`                                   | `auth.service.js`                  |
| Duplicate email     | `409`                                                                              | `auth.service.js`                  |
| Validation failure  | `400 { error: { code: 'VALIDATION_ERROR', details: [{ field, message, type }] } }` | `middlewares/validate.js`          |
| Auth rate limit     | 20 requests / 15 min → `429 RATE_LIMITED`                                          | `auth.routes.js`                   |
| Password policy     | 12–72 chars **and** ≤ 72 UTF-8 bytes (bcrypt)                                      | `auth.validation.js`               |
| One-time token      | 32–256 chars, `/^[A-Za-z0-9_-]+$/`                                                 | same                               |
| CORS                | `credentials: true`, origin allowlist from `CORS_ORIGIN`                           | `app.js`                           |

Because the cookie is `SameSite=lax` and path-scoped, the frontend is served **same-origin** with the
API behind `/api`. The proxy is not a convenience — a cross-origin setup would require
`SameSite=None; Secure` on the backend.

### Refresh-token reuse detection

The backend treats a reused refresh token as a compromise: it revokes the whole session family
(`REFRESH_TOKEN_REUSE`). The client must therefore never refresh concurrently. `services/http/
interceptors.js` keeps a single in-flight refresh promise that every waiting `401` joins, and retries
each request **once**. This is the single most important detail in the auth layer and is covered by a
dedicated test that fires three parallel 401s and asserts exactly one `/auth/refresh` call.

## Endpoint map (from the OpenAPI document)

| Area          | Endpoints                                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification` |
| Users         | `GET/PATCH /users/me`, `DELETE /users/me`, `PATCH /users/me/password`, `GET /users/:userId` (self only)                                                                                       |
| Organizations | `GET/POST /organizations`, `GET/PATCH/DELETE /organizations/:organizationId`, `POST /organizations/:organizationId/switch`                                                                    |
| Members       | `GET /organizations/:organizationId/members`, `PATCH …/members/:memberId/role`, `DELETE …/members/:memberId`                                                                                  |
| Invitations   | `GET/POST /organizations/:organizationId/invitations`, `DELETE …/invitations/:invitationId`, `POST /invitations/accept`                                                                       |
| Projects      | `GET/POST /organizations/:id/projects`, `GET/PATCH/DELETE …/projects/:projectId`, `PATCH …/:projectId/archive`, `PATCH …/:projectId/restore`                                                  |
| Project team  | `GET …/projects/:projectId/members`, `POST/PATCH/DELETE …/members/:userId`                                                                                                                    |
| Tasks         | `GET/POST …/projects/:projectId/tasks`, `GET/PATCH/DELETE …/tasks/:taskId`, `PATCH …/tasks/:taskId/status`, `PATCH …/tasks/:taskId/assignee`, `GET …/tasks/:taskId/subtasks`                  |
| My tasks      | `GET /organizations/:organizationId/tasks/my`                                                                                                                                                 |
| Comments      | `GET/POST …/tasks/:taskId/comments`, `PATCH/DELETE …/comments/:commentId`                                                                                                                     |
| Activity      | `GET /organizations/:id/activity`, `GET …/projects/:projectId/activity`                                                                                                                       |
| Analytics     | `GET /organizations/:id/analytics`, `GET …/projects/:projectId/analytics`                                                                                                                     |
| Notifications | `GET /organizations/:id/notifications`, `GET …/unread-count`, `PATCH …/read-all`, `PATCH …/:notificationId/read`                                                                              |
| System        | `GET /health`, `GET /health/ready`                                                                                                                                                            |

## Enums used by the UI

| Concept               | Values                                                                           |
| --------------------- | -------------------------------------------------------------------------------- |
| Organization role     | `Owner`, `Admin`, `Manager`, `Member`, `Viewer`                                  |
| Invitable role        | `Admin`, `Manager`, `Member`, `Viewer`                                           |
| Project status        | `planning`, `active`, `on_hold`, `completed`, `cancelled`                        |
| Project visibility    | `organization`, `private`                                                        |
| Project member role   | `Owner`, `Editor`, `Viewer`                                                      |
| Task status           | `todo`, `in_progress`, `in_review`, `done`, `cancelled`                          |
| Task priority         | `low`, `medium`, `high`, `urgent`                                                |
| Notification category | `mention`, `task_assigned`, `comment`, `task_due_soon`, `task_overdue`, `system` |
| Analytics granularity | `day`, `week`, `month`                                                           |

IDs are 24-character hex MongoDB ObjectIds; matching Zod schemas use
`/^[a-fA-F0-9]{24}$/`.

## Query parameters supported by the backend

- **Projects:** `page`, `limit`, `q`, `status`, `visibility`, `archived`, `dueAfter`, `dueBefore`,
  `sort`, `order`
- **Project tasks / My tasks:** `page`, `limit`, `q`, `status`, `priority`, `assigneeId` (project
  only), `parentTaskId` (project only), `label`, `dueAfter`, `dueBefore`, `sort`, `order`
- **Members:** `page`, `limit`
- **Activity:** `page`, `limit`, `projectId`, `taskId`, `actorId`, `action`, `targetType`, `from`,
  `to`
- **Analytics:** `from`, `to` (ISO datetimes), `granularity=day|week|month`
- **Notifications:** `page`, `limit`, `category`, `unreadOnly`

The client sends **only** these parameters. Anything else (global search, member text search) is not
part of the contract and is therefore not presented as functional.

## Documented backend dependencies (not gaps in the frontend)

- **No calendar endpoint.** The calendar view is built client-side from paginated task data
  (`dueDate` ranges via `dueAfter`/`dueBefore`). Phase 8 documents the pagination caveat explicitly.
- **No member search parameter.** The member list supports `page`/`limit` only; any filtering is
  client-side over the fetched page and labelled as such.
- **No real-time channel.** Notifications use `unread-count` polling with a conservative interval
  plus focus-based refetch — no websockets are simulated.
- **No global user directory.** `GET /users/:userId` is restricted to the authenticated user;
  people are discovered through organization members and project members.
- **No mail transport by default.** Password reset and invitations require a configured mail adapter
  in the backend; the UI reports this honestly when a token never arrives.
- **Slug uniqueness.** Organization names map to a unique slug; a `409 ORGANIZATION_SLUG_TAKEN`
  surfaces as an inline conflict message.

## Adding a new integration

1. Confirm the operation exists in `/openapi.json`; note request/response schemas and enums.
2. Add or extend a service module in `src/services/`. Keep it a pure function of its inputs.
3. Add a Zod schema in `src/schemas/` when the payload is user-supplied.
4. Wrap it in a TanStack Query hook under the feature's `hooks/` directory with a namespaced key.
5. Implement loading, empty, error, and validation states.
6. Add tests for success and failure paths.
7. Update this document's endpoint map.
