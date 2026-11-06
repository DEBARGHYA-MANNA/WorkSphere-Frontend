# Architecture

## Goals

1. **Feature isolation.** Each product area owns its pages, components, hooks, and API calls.
2. **One source of truth per concern.** Server data lives in TanStack Query; local UI state lives in
   Zustand; nothing is duplicated between them.
3. **Contract fidelity.** The backend OpenAPI document defines every request and response shape. The
   frontend never invents endpoints, query parameters, roles, or response fields.
4. **Predictable failure.** Every network path has loading, empty, validation, and error states.

## Layers

```text
┌──────────────────────────────────────────────┐
│ pages            feature/pages/*.jsx         │  route components, layout composition
├──────────────────────────────────────────────┤
│ feature UI       feature/components/*        │  presentational + container components
├──────────────────────────────────────────────┤
│ feature hooks    feature/hooks/*             │  TanStack Query hooks, form controllers
├──────────────────────────────────────────────┤
│ services         services/*-service.js       │  thin, contract-shaped API functions
├──────────────────────────────────────────────┤
│ http client      services/http/*             │  Axios instance, interceptors, envelope
├──────────────────────────────────────────────┤
│ primitives       components/ui/*, lib/*      │  design system + framework-free helpers
└──────────────────────────────────────────────┘
```

Dependencies point **downward only**. `lib/` and `components/ui/` never import from `features/`.

## State ownership

| Kind of state                         | Owner                | Example                                 |
| ------------------------------------- | -------------------- | --------------------------------------- |
| Server resources                      | TanStack Query cache | projects, tasks, members, notifications |
| URL-derived state                     | React Router         | `?status=in_progress&page=2`            |
| Form state                            | React Hook Form      | create-project form                     |
| Ephemeral UI state                    | Local `useState`     | dialog open, hover, expanded row        |
| Cross-cutting client preferences      | Zustand (`ui-store`) | theme, sidebar collapsed, compact list  |
| Session identity (access token, user) | Auth store (Phase 3) | in-memory access token + user profile   |

**Rules**

- Never copy a server list into Zustand. Read it from the query cache.
- Never persist the refresh token in JS storage — the backend issues it as an HttpOnly cookie.
- The access token lives in memory only (never `localStorage`), and is re-minted via
  `POST /auth/refresh` on reload.

## Server state conventions

- Query keys are namespaced arrays rooted in `QUERY_KEYS` (`['tasks', 'list', { … }]`) so a feature
  can invalidate a whole subtree precisely.
- List queries key on their full filter object; changing a filter creates a new cache entry instead
  of mutating the old one.
- Pagination is **server-side** (`page`, `limit`) and mirrors the backend's response envelope
  `pagination: { page, limit, total, totalPages }`.
- Mutations invalidate every affected namespace (e.g. task update → `tasks`, `analytics`,
  `notifications`) rather than hand-patching caches, except where an optimistic update with a tested
  rollback is implemented (Kanban status moves in Phase 8).
- Requests carry an `AbortSignal` so navigating away cancels in-flight work.

## Error model

`services/http/envelope.js` normalises responses; `services/http/interceptors.js` converts every
rejection into an `ApiError` with `{ status, code, message, details, requestId }`.

- `code` maps HTTP status → stable string (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION`, …).
- `details` carries field-level validation errors keyed by field name, so forms can map them onto
  React Hook Form with `setError`.
- The backend's `X-Request-Id` / `requestId` is preserved for support reporting and is **never**
  displayed raw to end users.
- 5xx messages are never surfaced verbatim; a generic, non-leaking message is shown instead.

## Authentication and authorization

- Access token in memory; refresh token in an HttpOnly, `Path=/api/v1/auth` cookie set by the
  backend. The browser cannot read it, and that is intentional.
- The Axios client uses `withCredentials: true` so the cookie travels on refresh/logout calls.
- A single-flight refresh queue prevents parallel 401s from stampeding `POST /auth/refresh`. Failed
  refresh → session cleared → redirect to `/login?redirect=<safe path>`, guarded against loops.
- Authorization is **advisory in the UI only**. Buttons are hidden/disabled using the organization
  role, but every protected request is still authorized server-side and 403s are handled gracefully.

## Rendering and performance

- Route-level `React.lazy` + `Suspense` with a shape-matching skeleton.
- Debounced search (350 ms) before it becomes a query key change.
- Memoised expensive tables/charts; virtualisation only if measurements demand it.
- Zod schemas are shared between forms and (where useful) response validation.

## Accessibility baseline

- Landmarks: `aside[aria-label]`, `header`, `main#main-content`, skip link.
- All interactive elements are keyboard reachable with a visible focus ring (`:focus-visible`).
- Radix primitives supply correct ARIA for dialogs, menus, selects, and tabs.
- Live regions announce async results (toasts, inline status).
- `prefers-reduced-motion` disables non-essential animation.

## Directory decisions

- `app/` holds composition concerns (providers, router, layouts) rather than business logic.
- `features/*/` is the only place product logic lives; each slice exposes only its page and, if
  needed, a public component from `features/<slice>/components/`.
- `services/` contains one module per backend resource, mirroring the OpenAPI tags
  (auth, users, organizations, members, invitations, projects, tasks, comments, activity,
  analytics, notifications).
