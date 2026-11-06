import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

/**
 * `/` has no screen of its own. Once authentication lands in Phase 3 this
 * redirects to the dashboard for signed-in users and to `/login` otherwise.
 */
export function RootRedirect() {
  return <Navigate to={ROUTES.dashboard} replace />
}
