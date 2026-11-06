import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth-service'
import {
  broadcastLogout,
  isRefreshing,
  refreshAccessToken,
  subscribeToSession,
} from '@/services/http/interceptors'
import { httpClient } from '@/services/http/client'
import { getAccessToken } from '@/services/http/token-store'
import { AUTH_STATUS, useAuthStore } from '@/features/auth/auth-store'
import { logger } from '@/lib/logger'

/**
 * Session bootstrap + lifecycle.
 *
 * Runs once at the app root:
 *  1. Ask the backend to exchange the HttpOnly refresh cookie for an access token
 *     (`POST /auth/refresh`). This is the *only* way the app knows whether the
 *     user is signed in after a reload, because the token is memory-only.
 *  2. On success, load the profile (`GET /users/me`).
 *  3. React to session events from the HTTP layer (token refreshed elsewhere,
 *     refresh failed, signed out in another tab).
 *
 * A failed bootstrap is **not** an error state: it simply means "not signed in",
 * which is the normal case for a first-time visitor.
 */
export function useSessionBootstrap() {
  const queryClient = useQueryClient()
  const status = useAuthStore((state) => state.status)
  const startedRef = useRef(false)

  const bootstrap = useCallback(async () => {
    const store = useAuthStore.getState()

    // A token already exists (e.g. another tab handed one over) — just hydrate.
    if (getAccessToken()) {
      store.setChecking()
      try {
        const user = await authService.me()
        store.setSession({ user, accessToken: getAccessToken() })
      } catch (error) {
        logger.debug('Session bootstrap profile fetch failed', error?.status)
        store.clearSession()
      }
      return
    }

    store.setChecking()
    try {
      const token = await refreshAccessToken(httpClient)
      const user = await authService.me()
      useAuthStore.getState().setSession({ user, accessToken: token })
    } catch (error) {
      // No cookie, expired cookie, or revoked session: expected for visitors.
      logger.debug('No resumable session', error?.code)
      useAuthStore.getState().clearSession()
    }
  }, [])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (status === AUTH_STATUS.idle) bootstrap()
  }, [bootstrap, status])

  // Session events raised by the HTTP layer.
  useEffect(() => {
    return subscribeToSession((event) => {
      const store = useAuthStore.getState()

      if (event.type === 'refreshed' && event.user) {
        store.setUser(event.user)
        return
      }

      if (event.type === 'expired' && store.status === AUTH_STATUS.authenticated) {
        // The session genuinely ended (refresh failed, revoked, or signed out in
        // another tab). Drop all cached server data: it belongs to that session.
        store.clearSession(event.reason ?? 'session_expired')
        queryClient.clear()
      }
    })
  }, [queryClient])

  // If a refresh is already in flight, reflect that in the UI status.
  useEffect(() => {
    if (status === AUTH_STATUS.authenticated && isRefreshing()) {
      useAuthStore.getState().setChecking()
    }
  }, [status])

  return { retry: bootstrap }
}

/**
 * Sign out of this device.
 * Always clears local state, even if the network call fails — a user who asks to
 * sign out must never be left signed in.
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      // 401 here just means the session was already gone; nothing to report.
      logger.debug('Logout request failed', error?.status)
    } finally {
      useAuthStore.getState().clearSession('signed_out')
      queryClient.clear()
      broadcastLogout()
    }
  }, [queryClient])
}
