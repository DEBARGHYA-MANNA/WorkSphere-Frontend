import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageSkeleton } from '@/components/common/page-skeleton'
import { ErrorBoundary } from '@/components/common/error-boundary'

/**
 * Authenticated application shell.
 *
 * Phase 1 establishes the structural contract only: a sidebar slot, a header
 * slot, and a scrollable main region that hosts routed pages. Phase 2 replaces
 * the placeholders with the real navigation, header, and organization switcher.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="flex flex-1">
        <aside
          aria-label="Primary navigation"
          className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
        >
          <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
            <span className="text-sm font-semibold tracking-tight">WorkSphere</span>
          </div>
          <div className="p-4 text-xs text-muted-foreground">
            Navigation is delivered in Phase 2.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
            <span className="text-sm font-medium text-muted-foreground">Application header</span>
            <span className="text-xs text-muted-foreground">Phase 2</span>
          </header>

          <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:outline-none">
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <div className="page-container">
                  <Outlet />
                </div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  )
}
