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

### Verified

- `npm run dev` serves the app; `/`, `/dashboard`, and unknown routes resolve correctly.
- `npm run build` succeeds with per-route chunks.
- `npm run lint`, `npm run format:check`, and `npm test` (22 tests) pass.
