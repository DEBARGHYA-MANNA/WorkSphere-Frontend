# Contributing

## Branching

Branch from the latest `develop`; never commit feature work directly to `main` or `develop`.

```text
feature/<scope>     feature/authentication, feature/task-management
bugfix/<scope>      bugfix/fix-mobile-sidebar
refactor/<scope>    refactor/api-service-layer
docs/<scope>        docs/update-frontend-readme
chore/<scope>       chore/bump-vite
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(auth): implement login page
feat(tasks): implement kanban board
fix(tasks): fix status update rollback
refactor(api): centralize axios configuration
test(auth): add login validation tests
docs(readme): update setup instructions
chore(deps): bump vite to 5.4.11
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`, `build`, `ci`.
Scopes mirror features or layers: `auth`, `tasks`, `projects`, `api`, `ui`, `a11y`, `ci`.

## Pull requests

Target `develop`. Each PR includes:

1. **Overview** — what problem this solves.
2. **Implemented changes** — bullet list by area.
3. **Screenshots / recordings** — required for any UI change, light **and** dark, desktop and mobile.
4. **API integration details** — endpoints used, verified against `/openapi.json`.
5. **Tests performed** — commands run and their result.
6. **Known limitations** — anything intentionally deferred, plus backend dependencies.
7. **Checklist** — below.

### PR checklist

- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run format:check` passes
- [ ] `npm test` passes; new behaviour has tests
- [ ] `npm run build` succeeds
- [ ] Loading, empty, error, and validation states implemented
- [ ] Keyboard navigation and focus states verified
- [ ] Light and dark themes verified
- [ ] Mobile viewport verified (not just shrunk)
- [ ] No TypeScript, no Docker, no new dependency without justification
- [ ] No invented endpoints, fields, roles, or response shapes
- [ ] Docs updated (`README`, `API_INTEGRATION`, `CHANGELOG` as applicable)
- [ ] No secrets, tokens, or personal data in code, logs, or fixtures

## Code review

Solo development still requires a self-review pass: re-read the diff, run the full check suite, and
confirm the checklist before merging. When collaborating, at least one approval is required and all
required checks must be green. Merged feature branches are deleted.

## Coding standards

- **JavaScript/JSX only.** `.ts`/`.tsx` files are rejected.
- Two-space indent, no semicolons, single quotes, trailing commas, 100-character lines (Prettier).
- Prefer named exports; pages use default exports for lazy loading.
- Absolute imports via `@/…`; no `../../../` chains.
- No `console.log` — use `@/lib/logger` (warn/error only in production).
- Handle every promise; never leave a floating rejection.
- Keep components free of business logic; move it into hooks or services.

## Definition of done

- Feature works against the real API contract, with all states handled.
- Tests cover the success and failure paths.
- Documentation reflects reality.
- Lint, format, tests, and production build pass locally and in CI.
