import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/common/error-boundary'

/**
 * Layout for the public authentication screens.
 *
 * Auth pages are lazy-loaded, so they need a Suspense boundary of their own: the
 * shell's boundary sits inside `ProtectedRoute` and never covers these routes.
 * Without it React throws "a component suspended while responding to synchronous
 * input" on the first navigation.
 */
export function PublicLayout() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div
            className="flex min-h-dvh items-center justify-center bg-background"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading…</span>
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}
