# Component Guidelines

## Principles

1. **Tokens, not hex.** Every colour, radius, shadow, and font comes from the design tokens in
   `src/styles/globals.css`. A raw hex value or arbitrary spacing in a component is a review blocker.
2. **Small and composable.** A component that needs more than ~200 lines or more than one concern is
   split.
3. **Feature-first.** Product components live in `src/features/<slice>/components/`. Only genuinely
   reusable pieces belong in `src/components/`.
4. **Accessible by default.** Semantic elements first; ARIA only where semantics fall short.
5. **No business logic in pages.** Pages compose; hooks and services do the work.

## Naming and file layout

```text
features/projects/
├── pages/projects-page.jsx           # default export, route entry
├── components/project-card.jsx       # PascalCase component, kebab-case file
├── components/project-grid.jsx
└── hooks/use-projects.js             # TanStack Query hooks
```

- One component per file, exported as a named export; pages use a default export for `React.lazy`.
- Files: `kebab-case.jsx`. Components: `PascalCase`. Hooks: `use-thing.js`.
- Props are destructured in the signature; pass `...props` through to the underlying element.

## Design tokens

| Token group | Utilities                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| Surfaces    | `bg-background`, `bg-surface`, `bg-surface-muted`, `bg-card`, `bg-popover`      |
| Text        | `text-foreground`, `text-muted-foreground`                                      |
| Brand       | `bg-primary`, `text-primary`, `bg-accent`, `text-accent-foreground`             |
| Status      | `success`, `warning`, `destructive`, `info` — each with a `-muted` variant      |
| Borders     | `border-border`, `border-input`, `ring-ring`                                    |
| Sidebar     | `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`                |
| Radius      | `rounded-sm … rounded-2xl` (derived from `--radius`)                            |
| Elevation   | `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`                              |
| Type scale  | `text-2xs`, `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` |

Status colours always pair a strong foreground with a `-muted` background:
`bg-success-muted text-success`. Never place status text on the saturated colour.

## Component patterns

### Buttons

```jsx
import { Button } from '@/components/ui/button'

<Button>Primary action</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="ghost" size="icon" aria-label="Open settings"><Settings /></Button>
<Button variant="destructive" loading={isPending}>Delete</Button>
<Button asChild><Link to="/projects">Browse projects</Link></Button>
```

- Icon-only buttons **must** have an `aria-label`.
- Use `loading` for async actions instead of swapping the label manually.
- `asChild` delegates rendering (Links, labels) while keeping styles.

### Layout components

Compose pages from these instead of hand-rolling chrome:

| Component    | Use                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------- |
| `PageHeader` | Every page title row: `title`, `description`, `actions`, plus `children` for filters/tabs |
| `Section`    | A titled block inside a page (`space-y-4` rhythm built in)                                |
| `EmptyState` | Empty list/area: icon, title, description, one primary action                             |
| `UserAvatar` | Person avatar with initials fallback; sizes `xs…lg`                                       |
| `Logo`       | Wordmark + glyph, `showText={false}` for the collapsed rail                               |

`PageHeader` renders a `<div>`, not a `<header>`: the app header is the single `banner` landmark.
Using `<header>` inside page content creates a second banner region and confuses screen-reader
landmark navigation.

### `asChild` and Radix Slot

`Button asChild` delegates rendering to **exactly one** child element so Radix `Slot` can merge the
button's `className` and `aria-*` onto it:

```jsx
<Button asChild variant="ghost" size="icon" aria-label="Notifications">
  <Link to="/notifications">
    <Bell />
  </Link>
</Button>
```

Never wrap the child in a fragment or add a sibling element — `Slot` then merges onto the wrong
node and the styles silently disappear. That is why `loading` is ignored on the `asChild` path.

### Layout rhythm

- Page container: `<div className="page-container">` (max width + responsive padding).
- Page header: title (`text-2xl font-semibold tracking-tight`), description
  (`text-sm text-muted-foreground`), actions right-aligned, then a `border-b` separator.
- Section spacing: `space-y-6`; card padding `p-5`–`p-6`; grid gaps `gap-4`–`gap-6`.

### Cards and panels

- `rounded-xl border border-border bg-card shadow-xs`.
- Hover affordance only when the whole card is clickable (`transition hover:border-primary/40`),
  and then the card is a link/button element, not a `div` with an `onClick`.

### Forms

- React Hook Form + Zod via `@hookform/resolvers`.
- Every input has a `<Label htmlFor>`; errors are rendered with `role="alert"` and
  `aria-describedby` pointing at the message.
- Submit buttons show `loading` and are disabled while pending.
- Map backend `400/422` field errors onto the form with `setError(field, { message })`.
- Server errors (non-field) render in an inline alert above the form, not only in a toast.

### Empty, loading, and error states

Every data view implements all four:

| State   | Requirement                                                         |
| ------- | ------------------------------------------------------------------- |
| Loading | Skeleton matching the eventual layout (`PageSkeleton`, card rows)   |
| Empty   | Short explanation + the action that would create the first item     |
| Error   | Message from `getErrorMessage`, a Retry button, and no stack traces |
| Success | Rendered data with stable keys                                      |

### Dialogs and menus

- Use Radix-based primitives (`components/ui/dialog`, `dropdown-menu`, `select`).
- A dialog always has a `DialogTitle` (visually hidden if necessary) for screen readers.
- Destructive confirmations state the exact object being affected and are irreversible-by-default
  (`Cancel` focused first).

## Accessibility checklist

- [ ] Keyboard reachable in DOM order; no positive `tabIndex`.
- [ ] Visible focus ring (`:focus-visible` from tokens) on every interactive element.
- [ ] Icon-only controls have accessible names.
- [ ] Form inputs are label-associated; errors announced.
- [ ] Colour is never the only carrier of meaning (pair with icon/text).
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI borders.
- [ ] Lists use list semantics; tables use `<caption>` or a labelled region.

## Anti-patterns

- ❌ Hard-coded colours (`#4f46e5`, `text-gray-500`) instead of tokens.
- ❌ `!important` overrides to fight component styles — fix the variant instead.
- ❌ Fetching inside presentational components.
- ❌ `useEffect` to derive state that could be computed during render.
- ❌ Storing server responses in Zustand.
- ❌ Presenting mock data as real, or building UI for endpoints that do not exist.
- ❌ Click handlers on non-interactive elements without role/keyboard support.
