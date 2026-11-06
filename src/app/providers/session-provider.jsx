import { useEffect } from 'react'
import { httpClient } from '@/services/http/client'
import { attachCrossTabSync, attachInterceptors } from '@/services/http/interceptors'
import { useSessionBootstrap } from '@/features/auth/hooks/use-session'

/**
 * Wires the session together once, at the app root:
 *
 *  1. installs the HTTP interceptors (error normalisation, 401 → single-flight
 *     refresh → one retry)
 *  2. starts cross-tab token hand-off over BroadcastChannel
 *  3. bootstraps the session from the HttpOnly refresh cookie
 *
 * Rendering children immediately (rather than gating on the bootstrap) lets the
 * route guards show their own "restoring your session" state, which keeps deep
 * links working without a flash of the login page.
 */
export function SessionProvider({ children }) {
  useSessionBootstrap()

  useEffect(() => {
    const detachInterceptors = attachInterceptors(httpClient)
    const detachCrossTab = attachCrossTabSync()
    return () => {
      detachInterceptors()
      detachCrossTab()
    }
  }, [])

  return children
}
