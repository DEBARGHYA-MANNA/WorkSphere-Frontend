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

### Fixed

- `Button asChild` silently lost all styles and ARIA attributes because children were wrapped in a
  fragment, which breaks Radix `Slot` prop merging. Affected every link rendered as a button.
- Page-level headers created a duplicate `banner` landmark; page headers now render a `<div>`.
- Focus was stolen from the browser on first paint; focus now moves to `<main>` only on real
  navigation.

### Verified

- `npm run dev` serves the app; `/`, `/dashboard`, and unknown routes resolve correctly.
- `npm run build` succeeds with per-route chunks.
- `npm run lint`, `npm run format:check`, and `npm test` (68 tests) pass.
