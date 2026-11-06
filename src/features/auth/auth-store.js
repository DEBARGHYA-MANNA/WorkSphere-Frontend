import { create } from 'zustand'
import { clearAccessToken, setAccessToken } from '@/services/http/token-store'

/**
 * Session state.
 *
 * Holds only what the UI needs to know about *identity*:
 *   - `user`           the signed-in profile (server-owned, mirrored here because
 *                      it is the session itself, not a cached list)
 *   - `status`         lifecycle for routing decisions
 *   - `emailVerificationRequired`  read from the register response, never assumed
 *
 * The access token is NOT here — it lives in `services/http/token-store` so it
 * cannot leak through store devtools, persistence, or a stray JSON.stringify.
 *
 * `status` values
 *   'idle'        nothing attempted yet (initial paint)
 *   'checking'    bootstrapping: trying the refresh cookie
 *   'authenticated'
 *   'unauthenticated'
 */
export const AUTH_STATUS = Object.freeze({
  idle: 'idle',
  checking: 'checking',
  authenticated: 'authenticated',
  unauthenticated: 'unauthenticated',
})

export const useAuthStore = create((set, get) => ({
  user: null,
  status: AUTH_STATUS.idle,
  emailVerificationRequired: false,
  /** Why the session ended — drives the message shown on /login. */
  endedReason: null,

  setChecking: () => set({ status: AUTH_STATUS.checking, endedReason: null }),

  /**
   * Record an established session.
   * @param {{ user: object, accessToken: string, expiresIn?: number }} session
   */
  setSession: ({ user, accessToken, expiresIn }) => {
    setAccessToken(accessToken, expiresIn)
    set({
      user: user ?? get().user,
      status: AUTH_STATUS.authenticated,
      endedReason: null,
    })
  },

  /** Update just the profile (after PATCH /users/me in Phase 12). */
  setUser: (user) => set({ user }),

  setEmailVerificationRequired: (required) => set({ emailVerificationRequired: Boolean(required) }),

  /** Clear everything and drop the in-memory token. */
  clearSession: (reason = null) => {
    clearAccessToken()
    set({
      user: null,
      status: AUTH_STATUS.unauthenticated,
      endedReason: reason,
      emailVerificationRequired: false,
    })
  },

  isAuthenticated: () => get().status === AUTH_STATUS.authenticated,
}))

/** Derived helpers usable outside React (route guards, tests). */
export const authState = () => useAuthStore.getState()
