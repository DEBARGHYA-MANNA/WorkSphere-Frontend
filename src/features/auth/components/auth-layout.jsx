import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/logo'
import { APP_TAGLINE, ROUTES } from '@/lib/constants'

/**
 * Shared frame for every authentication screen.
 *
 * A single centred column on mobile; a two-panel split on large screens where the
 * brand panel earns its place with the product promise rather than decoration.
 */
export function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — hidden on small screens to keep the form above the fold. */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, currentColor 0, transparent 45%), radial-gradient(circle at 80% 70%, currentColor 0, transparent 45%)',
          }}
        />
        <Logo />
        <div className="relative max-w-sm space-y-4">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-sidebar-foreground">
            {APP_TAGLINE}
          </p>
          <p className="text-sm leading-relaxed text-sidebar-muted">
            Plan projects, assign work, and keep every team in sync — with one workspace that stays
            out of your way.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-muted">
          © {new Date().getFullYear()} WorkSphere. All rights reserved.
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center px-6 lg:hidden">
          <Link
            to={ROUTES.login}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="WorkSphere home"
          >
            <Logo size="sm" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-2 lg:px-12">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="mb-6 space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>

            {children}

            {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  )
}
