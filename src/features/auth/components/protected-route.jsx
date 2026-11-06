import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AUTH_STATUS, useAuthStore } from '@/features/auth/auth-store'
import { loginUrlWithRedirect, safeRedirect } from '@/features/auth/redirect'

/** Full-screen neutral state while the refresh cookie is being checked. */
function SessionLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Restoring your session…</p>
    </div>
  )
}

/**
 * Guard for authenticated screens.
 *
 * While the session is bootstrapping it renders a status region instead of
 * redirecting — redirecting on `idle`/`checking` would bounce a signed-in user to
 * the login screen on every reload, and then the login screen would bounce them
 * back once the cookie resolves. That is the redirect loop to avoid.
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === AUTH_STATUS.idle || status === AUTH_STATUS.checking) {
    return <SessionLoading />
  }

  if (status !== AUTH_STATUS.authenticated) {
    // Preserve the intended destination, including its query string.
    const from = `${location.pathname}${location.search}`
    return <Navigate to={loginUrlWithRedirect(from)} replace state={{ from }} />
  }

  return <Outlet />
}

/**
 * Guard for public/auth screens.
 * An already-authenticated user is sent on to the requested destination (or the
 * dashboard) instead of seeing a login form they do not need.
 */
export function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === AUTH_STATUS.idle || status === AUTH_STATUS.checking) {
    return <SessionLoading />
  }

  if (status === AUTH_STATUS.authenticated) {
    const target = new URLSearchParams(location.search).get('redirect')
    // Sanitised again here: the guard trusts nothing that came from the URL.
    return <Navigate to={safeRedirect(target)} replace />
  }

  return <Outlet />
}
