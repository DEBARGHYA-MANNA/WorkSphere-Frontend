import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { AUTH_STATUS, useAuthStore } from '@/features/auth/auth-store'

/**
 * `/` has no screen of its own: send authenticated users to the dashboard and
 * everyone else to the login screen.
 *
 * While the session is still being restored it renders a status region instead of
 * guessing — redirecting early is what produces a login → dashboard → login loop.
 */
export function RootRedirect() {
  const status = useAuthStore((state) => state.status)

  if (status === AUTH_STATUS.idle || status === AUTH_STATUS.checking) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading WorkSphere…</span>
      </div>
    )
  }

  return (
    <Navigate to={status === AUTH_STATUS.authenticated ? ROUTES.dashboard : ROUTES.login} replace />
  )
}
