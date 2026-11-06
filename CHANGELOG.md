# Changelog

All notable changes to the WorkSphere frontend are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 1: Project foundation

- React 18 + Vite 5 application scaffolded in JavaScript/JSX only (no TypeScript, no Docker).
- Tailwind CSS 3 with a `shadcn/ui` (new-york, CSS variables) setup and `components.json`.
- Design-token stylesheet (`src/styles/globals.css`) with light/dark semantic colour scales
  (surface, primary, accent, success, warning, destructive, info, sidebar), radius, elevation,
  typography, and focus-ring tokens.
- Theme system: `light | dark | system` preference persisted in `localStorage`, applied pre-paint to
  avoid a flash, live-follows the OS preference.
- Feature-based folder structure with a `@/` import alias and enforced import direction.
- Router with route-level code splitting, an authenticated `AppShell` layout, skip link, and
  explicit "not implemented yet" placeholders for phases 2–12 (no fake data).
- TanStack Query provider with retry policy that never retries 4xx.
- Zustand UI store limited to client preferences (theme, sidebar, active organization hint).
- Shared primitives: `Button` (variants, sizes, loading, `asChild`), `Badge`, `Skeleton`,
  `PageSkeleton`, `ErrorBoundary`, `RouteErrorPage`, `Toaster` (Sonner).
- HTTP layer scaffolding: environment config, `ApiError` normalisation, and envelope helpers
  (`unwrap`, `extractPagination`, `extractList`, `extractEnvelopeMessage`, `extractFieldErrors`)
  matching the backend contract.
- Tooling: ESLint 9 flat config with React, Hooks, a11y and Prettier integration; Prettier with the
  Tailwind plugin; Vitest + React Testing Library; Playwright configuration.
- GitHub Actions CI: format check, lint, unit tests, production build, dependency audit, and
  Chromium E2E.
- Documentation: `README`, `ARCHITECTURE`, `API_INTEGRATION`, `COMPONENT_GUIDELINES`, `TESTING`,
  `CONTRIBUTING`, `CHANGELOG`, and `.env.example`.

### Added — Phase 2: Design system and dashboard shell

- **Layout shell**: collapsible desktop sidebar rail, sticky header, scroll-managed `<main>`.
- **Mobile navigation**: full-height drawer (`Sheet`) with 44px touch rows that closes on navigate.
- **Organization switcher**: active organization + role, membership list, create entry, and an honest
  empty state; `useOrganizations` documents the Phase 4 API boundary.
- **Breadcrumbs**: pathname-derived trail, section-aware, ids resolved to real labels, `aria-current`
  on the last crumb, hidden on root sections.
- **Header controls**: notification entry point with unread badge (announced via accessible name),
  explicit light/dark/**system** theme menu, and a profile menu with account destinations.
- **Keyboard and focus**: skip link first in tab order, focus moved to `<main>` on route change (not
  on first load), focus-visibility rings on every interactive element.
- **Design-system components**: `PageHeader`, `Section`, `EmptyState`, `UserAvatar`, `Logo`, plus
  shadcn primitives `Avatar`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `ScrollArea`,
  `Separator`, `Sheet`, `Skeleton`, `Tooltip`.
- **Honest placeholders**: each remaining route states its phase, coming capabilities, and the exact
  backend endpoint it depends on — no mock data, and global search is shown `aria-disabled` because
  the API has no cross-resource search endpoint.
- **Tests**: 68 unit/component tests (shell structure, navigation, active state, collapse, drawer,
  focus order, breadcrumb building, header controls, Button `asChild` contract) and Playwright specs
  for the shell and responsive navigation.

### Added — Phase 3: Authentication

- **Central Axios client** (`services/http/client.js`) with `withCredentials`, bounded timeout,
  `FormData` passthrough, and automatic bearer-token attachment from the in-memory store.
- **In-memory access-token store** (`services/http/token-store.js`) — no storage API exists for the
  refresh token, so it cannot be persisted even by mistake.
- **Interceptors** (`services/http/interceptors.js`): backend-envelope error normalisation
  (`ApiError` with stable codes, field errors, request id, preserved `serverCode`), single-flight
  refresh for parallel 401s, one retry per request, session-expiry broadcast, and cross-tab token
  hand-off over `BroadcastChannel`.
- **Auth service** mirroring the OpenAPI "Authentication" tag: register, login, logout, logout-all,
  forgot/reset password, verify email, resend verification, and `GET /users/me`.
- **Session store** (`features/auth/auth-store.js`) with an explicit `idle → checking →
authenticated/unauthenticated` lifecycle and a recorded `endedReason` for the login screen.
- **Session bootstrap** that restores a session from the HttpOnly refresh cookie on cold start,
  hydrates the profile, and reacts to `refreshed`/`expired` events.
- **Route guards**: `ProtectedRoute` (renders "Restoring your session…" instead of redirecting while
  checking) and `PublicOnlyRoute` (keeps signed-in users out of auth screens).
- **Open-redirect protection** (`safeRedirect`) rejecting absolute URLs, protocol-relative paths,
  `javascript:`/`data:` schemes, control characters, and auth screens.
- **Auth screens**: login, register (with live password strength), forgot password, reset password —
  built on `AuthLayout` with a brand panel, `FormField` (label/`aria-invalid`/`aria-describedby`/
  `role="alert"`), `PasswordInput` (show/hide), and `FormAlert`.
- **Zod schemas** matching the backend's Joi rules, including the **72-byte** bcrypt limit (not just
  72 characters).
- **Sign-out** wired through the header profile menu, fail-safe when the network call fails.
- **`PublicLayout`** providing the Suspense boundary the lazy auth pages need.

### Added — Phase 4: Organization management

- **Organization list** (`/organizations`): every membership with the active one marked, role badges,
  and a switch action per card.
- **Create organization** dialog mirroring the backend validation — name 2–120 with at least one
  letter or digit, optional description ≤ 2000, and the invitation policy (`allowMemberInvites`,
  `defaultMemberRole` limited to Member/Viewer). A `409` slug collision is mapped onto the name field.
- **Organization switcher** (sidebar) now reads `GET /organizations` instead of the documented empty
  state, and creates organizations inline.
- **Organization settings** (`/settings/organization`): details + invitation policy form (read-only
  without `organization:update`), pending invitations, and an Owner-only delete zone behind a
  confirmation naming the organization.
- **Invitations**: list pending invitations (the endpoint returns only `pending` and unexpired),
  invite by email with a role the actor may actually assign (`canAssignRole`), and revoke behind a
  confirmation dialog.
- **`/accept-invitation`**: accepts a token from `?token=`, validates its shape client-side
  (32–256 chars of `[A-Za-z0-9_-]`), and explains `INVALID_INVITATION` (400), `ALREADY_A_MEMBER`
  (409), and `EMAIL_VERIFICATION_REQUIRED` (403). Success makes the joined organization the active
  context.
- **`src/lib/permissions.js`**: client-side mirror of the backend permission matrix
  (`ROLE_RANK`, per-role permissions, `canAssignRole`, `assignableRolesFor`). UX only — the backend
  still authorises every request.
- **Validation**: `organization-schemas.js` for create/update/invite, mirroring the Joi rules
  including the "at least one field" rule on `PATCH`.
- New UI primitives: `textarea`, `switch`, `select`.

### Notes — Phase 4

- **The invitation link cannot be displayed.** No endpoint returns the invitation token — it exists
  only inside the invitation email — so the invite dialog says so and offers no "copy link" action.
- **Email delivery is not guaranteed.** The backend mailer is a no-op when no transport is
  configured (`src/services/mailer.js` logs and returns, invitation-mail failures are swallowed), so
  success copy never claims an email was sent.
- The API returns raw Mongo documents; `organization-service.js#withId` normalises `_id` → `id` in
  the service layer so no component has to know which key to read.

### Fixed — Phase 3

- **`PasswordInput` did not forward its ref**, so React Hook Form never read the password and every
  auth form submitted an empty value. Now a `forwardRef` component with a regression test.
- Backend `error.code` strings were overwriting the normalised `ApiError.code`, silently breaking the
  `isValidationError` / `isForbidden` / … helpers. The backend code is now kept as `serverCode`.
- `extractFieldErrors` did not unwrap the backend's `error.details[]` nesting, so field-level
  validation errors were never mapped onto inputs.
- The public routes had no Suspense boundary, causing "a component suspended while responding to
  synchronous input" when lazy auth pages loaded.
- Empty email fields produced two conflicting messages ("required" + "invalid").

### Fixed — Phase 2

- `Button asChild` silently lost all styles and ARIA attributes because children were wrapped in a
  fragment, which breaks Radix `Slot` prop merging. Affected every link rendered as a button.
- Page-level headers created a duplicate `banner` landmark; page headers now render a `<div>`.
- Focus was stolen from the browser on first paint; focus now moves to `<main>` only on real
  navigation.

### Verified

- `npm run dev` serves the app; `/`, `/dashboard`, and unknown routes resolve correctly.
- `npm run build` succeeds with per-route chunks.
- `npm run lint`, `npm run format:check`, and `npm test` (199 tests) pass.
