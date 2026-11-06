# WorkSphere — Frontend

> One workspace. Every project. Better collaboration.

The web client for **WorkSphere**, a multi-tenant project-management platform. Built with React and
Vite in **JavaScript/JSX only** (no TypeScript), styled with Tailwind CSS and shadcn/ui primitives,
and integrated with the [WorkSphere Backend](https://github.com/DEBARGHYA-MANNA/WorkSphere-Backend)
through its published OpenAPI contract.

---

## Status

| Phase | Scope                               | State       |
| ----- | ----------------------------------- | ----------- |
| 1     | Project foundation                  | ✅ Complete |
| 2     | Design system and dashboard shell   | ✅ Complete |
| 3     | Authentication and session handling | ✅ Complete |
| 4     | Organization management             | ✅ Complete |
| 5     | Team management                     | Next        |
| 6     | Project management                  | Pending     |
| 7     | Task management                     | Pending     |
| 8     | Kanban and calendar views           | Pending     |
| 9     | Collaboration (comments, activity)  | Pending     |
| 10    | Notifications                       | Pending     |
| 11    | Dashboard and analytics             | Pending     |
| 12    | Settings                            | Pending     |
| 13    | Testing and QA                      | Pending     |
| 14    | Production readiness                | Pending     |
| 15    | Final integration and release       | Pending     |

Routes for later phases exist in the router and render an explicit "not implemented yet"
placeholder. Nothing is faked: no mock data is presented as real backend data.

---

## Requirements

- **Node.js 22 LTS** (or 20.19+). `.nvmrc`-less environments are fine; the CI matrix pins 22.
- **npm 10+**
- A running WorkSphere backend for full functionality — see
  [API_INTEGRATION.md](./API_INTEGRATION.md). The UI shell runs without one.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    Edit VITE_API_PROXY_TARGET if your backend is not on http://localhost:3000

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

The backend must be reachable at the proxy target for API calls to succeed. Start it with the
backend repository's own instructions (default `http://localhost:3000`, API base `/api/v1`).

## Scripts

| Script                  | Purpose                               |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Vite dev server with HMR on port 5173 |
| `npm run build`         | Production build into `dist/`         |
| `npm run preview`       | Serve the production build locally    |
| `npm run lint`          | ESLint, zero warnings tolerated       |
| `npm run lint:fix`      | ESLint with autofix                   |
| `npm run format`        | Prettier write                        |
| `npm run format:check`  | Prettier check (used by CI)           |
| `npm test`              | Vitest unit/component suite           |
| `npm run test:watch`    | Vitest in watch mode                  |
| `npm run test:coverage` | Vitest with V8 coverage               |
| `npm run test:e2e`      | Playwright end-to-end suite           |

## Project structure

```text
src/
├── main.jsx                  # React root
├── App.jsx                   # Provider composition + router
├── app/
│   ├── layouts/              # AppShell (authenticated chrome)
│   ├── providers/            # Theme + TanStack Query providers
│   └── router/               # Route table, lazy pages, nav metadata
├── components/
│   ├── ui/                   # shadcn/ui primitives (Button, Badge, Dialog, Sheet, …)
│   ├── common/               # PageHeader, EmptyState, Logo, UserAvatar, ErrorBoundary
│   └── layout/               # AppSidebar, AppHeader, MobileNav, Breadcrumbs,
│                             # OrganizationSwitcher, ThemeToggle, ProfileMenu
├── features/                 # Feature slices (pages, components, hooks, api)
│   ├── dashboard/ auth/ organizations/ members/ projects/ tasks/
│   └── comments/ notifications/ activity/ analytics/ settings/ errors/
├── hooks/                    # Reusable hooks (theme, media query, …)
├── lib/                      # Framework-free helpers, env, constants, errors
├── services/                 # Axios client, interceptors, API services
├── stores/                   # Zustand — client/UI state only
├── schemas/                  # Zod validation schemas
├── styles/                   # globals.css with design tokens
└── utils/                    # Formatting and domain utilities
tests/
├── setup.js                  # Vitest + RTL environment setup
└── e2e/                      # Playwright specs
```

**Import direction:** `features → components/ui + hooks + lib + services + stores`. Nothing in
`lib/` imports from `features/`. The `@/` alias maps to `src/`.

## Design system

Tokens live in `src/styles/globals.css` as HSL channel triplets and are wired into Tailwind in
`tailwind.config.js`. Components never use raw hex values.

- Semantic colours: `background`, `surface`, `card`, `popover`, `muted`, `primary`, `secondary`,
  `accent`, `destructive`, `success`, `warning`, `info`, plus a dedicated `sidebar` set.
- Light and dark themes; preference (`light | dark | system`) persists in `localStorage` and is
  applied before first paint to avoid a flash.
- Radius, elevation (`shadow-xs … shadow-lg`), focus ring, and motion tokens are shared.
- `prefers-reduced-motion` is honoured globally.

### Authentication and security

- **Access token: memory only.** It is held in a module-level store, never in
  `localStorage`, `sessionStorage`, IndexedDB, or a JS-readable cookie. A reload therefore loses it
  by design and the app re-mints one with `POST /auth/refresh`.
- **Refresh token: HttpOnly cookie.** Issued by the backend as `worksphereRefreshToken`, scoped to
  `Path=/api/v1/auth`, `SameSite=lax`. JavaScript cannot read it. Same-origin serving (Vite proxy in
  dev, reverse proxy in prod) keeps it first-party.
- **Concurrency-safe refresh.** Parallel `401`s share a single in-flight refresh. Firing several
  rotations at once would trip the backend's refresh-token reuse detection and revoke the session.
- **No redirect loops.** Route guards render a "Restoring your session…" status while the cookie is
  being checked, rather than redirecting on `idle`. Focus is never stolen.
- **Safe return paths.** `?redirect=` is sanitised: only internal absolute paths survive; `//host`,
  `https://…`, `javascript:…`, and auth screens fall back to the dashboard (open-redirect protection).
- **Email verification is not assumed.** `register` reads `emailVerificationRequired` from the
  response. With the backend's default `EMAIL_VERIFICATION_ENABLED=false`, users sign in immediately;
  if the flag is `true`, the "Check your email" screen appears instead.
- **Sign-out is fail-safe.** Local state is cleared even when the network call fails — a user who asks
  to sign out is never left signed in. Sibling tabs are notified over `BroadcastChannel`.
- **Field errors map to inputs.** Backend `400/422` `error.details` become per-field messages via
  React Hook Form `setError`, plus an inline alert for non-field failures.

### Dashboard shell

```text
┌──────────────────┬────────────────────────────────────────────┐
│ sidebar (lg+)    │ header (sticky): breadcrumbs · search*      │
│ logo             │                  notifications · theme · me  │
│ org switcher  ⌄  ├────────────────────────────────────────────┤
│ dashboard        │ <main id="main-content"> routed page        │
│ my tasks         │                                            │
│ projects         │                                            │
│ team members     │                                            │
│ notifications    │                                            │
│ settings         │                                            │
│ ── workspace ──  │                                            │
│ profile / org /  │                                            │
│ appearance  [«]  │                                            │
└──────────────────┴────────────────────────────────────────────┘
```

- **Collapsible rail.** Collapsing stores icons only; the preference persists in `localStorage`.
  Collapsed items expose their label through a tooltip and `sr-only` text.
- **Mobile drawer.** Below `lg` the sidebar becomes a full-height sheet with 44px touch rows; it
  closes on navigation and restores focus to the trigger.
- **Organization switcher.** Backed by `GET /organizations` (Phase 4). Shows the active organization
  and role, every membership to switch to, and a "Create organization" dialog. Switching calls
  `POST /organizations/:id/switch` to confirm membership, then drops every tenant-scoped query so no
  data from the previous organization can be shown. With no memberships it renders a truthful
  "No organization" state — never a placeholder company.
- **Breadcrumbs.** Built from the pathname; 24-char object ids are never shown raw — the owning page
  supplies a real label. Hidden on root sections where the page title already says where you are.
- **Theme switcher.** Explicit light / dark / system menu, not a two-state toggle.
- **Global search (\*).** Rendered `aria-disabled` with a tooltip explaining that the API exposes no
  cross-resource search endpoint. It is not simulated.
- **Focus management.** Navigation moves focus to `<main>`; the initial page load does not steal it.

See [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) for contribution rules.

## Testing

```bash
npm test                 # unit + component (Vitest + RTL)
npm run test:coverage    # with coverage report
npm run test:e2e         # Playwright (boots the dev server automatically)
```

API calls are mocked deterministically with `vi.mock` / MSW-style handlers; E2E specs run against an
isolated local backend or mocked network — never production. Details in [TESTING.md](./TESTING.md).

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — layering, state ownership, data flow
- [API_INTEGRATION.md](./API_INTEGRATION.md) — endpoints, envelope, refresh-cookie flow
- [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md) — design system usage
- [TESTING.md](./TESTING.md) — test strategy and conventions
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Git workflow, commits, PR checklist
- [CHANGELOG.md](./CHANGELOG.md) — release history

## Deployment

`npm run build` emits a static bundle in `dist/`. Serve it with any static host that supports
SPA fallback (rewrite unknown paths to `index.html`) and configure the reverse proxy to forward
`/api/*` to the backend **on the same origin** so the HttpOnly refresh cookie stays first-party.

Environment variables are build-time (`VITE_*`). Set `VITE_API_BASE_URL=/api/v1` for same-origin
deployments unless the API is served from a different host. No secrets may be placed in any
`VITE_*` variable — they are compiled into the public bundle.

## License

Private / internal project. See the repository owner for terms.
