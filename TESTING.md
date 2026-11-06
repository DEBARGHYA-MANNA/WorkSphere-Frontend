# Testing

## Strategy

| Layer       | Tool                           | What it covers                                             |
| ----------- | ------------------------------ | ---------------------------------------------------------- |
| Unit        | Vitest                         | Pure helpers, envelope parsing, error mapping, Zod schemas |
| Component   | Vitest + React Testing Library | Rendering, states, accessibility, user interaction         |
| Hooks       | Vitest + RTL `renderHook`      | Query hooks with a mocked API, store behaviour             |
| Integration | Vitest + RTL                   | Page-level flows with mocked HTTP (no real network)        |
| End-to-end  | Playwright                     | Critical workflows against a local, isolated backend       |

Tests are deterministic: no real network calls, no timers left running, no dependence on wall-clock
time (inject clocks or use `vi.setSystemTime`).

## Running

```bash
npm test                     # all Vitest suites, once
npm run test:watch           # watch mode
npm run test:coverage        # V8 coverage → ./coverage
npm run test:e2e             # Playwright (starts the dev server automatically)
npm run test:e2e -- --ui     # Playwright UI mode
```

Coverage configuration lives in `vite.config.js` under `test.coverage`.

## Conventions

- Co-locate specs with source: `src/lib/utils.js` → `src/lib/utils.test.js`.
- Component specs sit next to the component: `project-card.test.jsx`.
- Use **Testing Library queries by role and accessible name** — never by class or test-id unless
  nothing else identifies the element.
- One behaviour per test; the test name states the user-visible outcome.
- Prefer `await screen.findBy…` over `waitFor` for async appearance.
- No snapshot tests for markup (they hide regressions and block refactors).

### Shell and layout coverage (Phase 2)

`src/app/layouts/app-shell.test.jsx` asserts the structural contract of the shell: exactly one
`banner` and one `main` landmark, every primary destination present with the right `href`,
`aria-current` on the active item (including nested routes), collapse/expand persistence, the mobile
drawer opening, closing, and closing on navigation, skip-link focus order, and focus moving to
`<main>` after navigation while _not_ stealing focus on first load.

`src/components/layout/breadcrumbs.test.jsx` covers trail construction, label overrides, the rule
that raw 24-character object ids never render, and `aria-current` on the last crumb.

`src/components/ui/button.test.jsx` pins the `asChild` contract: styles and ARIA props must land on
the child element (a regression guard for the Radix `Slot` fragment bug).

### Authentication coverage (Phase 3)

| Area                 | Spec                                 | Notable assertions                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh concurrency  | `services/http/interceptors.test.js` | three parallel 401s → **one** `/auth/refresh`; one retry per request; no refresh for login/refresh; session cleared + `expired` event on failure; recovery after a failed refresh                                                                                                                                                |
| Error normalisation  | same                                 | cancel/timeout/network mapping; field errors + request id; **5xx internals never surfaced**                                                                                                                                                                                                                                      |
| Open-redirect safety | `features/auth/redirect.test.js`     | 18 cases incl. `//host`, `/\host`, `javascript:`, control chars, traversal                                                                                                                                                                                                                                                       |
| Validation parity    | `schemas/auth-schemas.test.js`       | 12-char minimum, **72-byte** bcrypt limit, matching passwords, token charset                                                                                                                                                                                                                                                     |
| Flows                | `features/auth/auth-flow.test.jsx`   | login→dashboard, original-page return, unsafe redirect ignored, field errors, password toggle, register (no auto-login, verification flag respected, 409 on email), forgot-password generic response, reset token prefill, guards, cold-start restore, failed refresh, sign-out (incl. network failure), session-ended messaging |
| Token storage        | same                                 | asserts the access token is **absent** from `localStorage` and `sessionStorage`                                                                                                                                                                                                                                                  |

`tests/auth-helpers.js` provides `signInForTest` / `signOutForTest` / `resetAuthForTest` so specs can
seed a session without touching the network.

### Example

```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/features/auth/components/login-form'

describe('LoginForm', () => {
  it('shows an accessible validation error for an invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i)
  })
})
```

## Mocking the API

- Service modules are mocked at the module boundary with `vi.mock('@/services/...')`.
- For page-level integration tests, stub the Axios instance or use a request-handler mock so the
  interceptors, envelope parsing, and error normalisation are exercised too.
- Fixtures live in `tests/fixtures/` and are **labelled as fixtures**. They mirror the backend
  OpenAPI shapes exactly and are never shipped to production code paths.

## Required states per view

Every data-driven view has tests for:

1. **Loading** — skeleton/`status` region present.
2. **Success** — representative data rendered with correct labels.
3. **Empty** — empty-state copy plus the primary action.
4. **Validation** — inline field errors and focus handling.
5. **Network error** — retry affordance and non-leaking message.
6. **Unauthorized (401)** — redirect to login, preserving the intended path.
7. **Forbidden (403)** — permission message instead of a crash.

## Accessibility checks

- `jest-axe` (added with the first interactive feature in Phase 3) runs on every page-level test.
- Playwright specs assert landmarks (`main`, `navigation`), skip-link behaviour, and that all
  interactive elements are keyboard reachable.
- Focus visibility is verified manually in both themes and via `:focus-visible` assertions where
  practical.

## End-to-end

- Specs live in `tests/e2e/` and run on desktop Chromium and a Pixel 7 viewport.
- `PLAYWRIGHT_BASE_URL` points at an already-running instance; otherwise the config boots
  `npm run dev`.
- E2E never touches production. The backend used for E2E must be an isolated instance with its own
  database.
- Every workflow spec must clean up data it creates (or run against a disposable database).

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`/`develop`:

1. `npm ci`
2. `npm run format:check`
3. `npm run lint` (zero warnings)
4. `npm run test`
5. `npm run build`
6. `npm audit --omit=dev --audit-level=high`
7. Playwright (Chromium desktop) after quality gates pass

A red job blocks merging.
