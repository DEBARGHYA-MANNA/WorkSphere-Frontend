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
