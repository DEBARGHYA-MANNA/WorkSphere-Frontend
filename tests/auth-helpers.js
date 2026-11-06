import { act } from '@testing-library/react'
import { AUTH_STATUS, useAuthStore } from '@/features/auth/auth-store'
import { setAccessToken, __resetTokenStoreForTests } from '@/services/http/token-store'
import { __resetRefreshStateForTests } from '@/services/http/interceptors'

/** A representative authenticated profile matching the backend user shape. */
export const testUser = Object.freeze({
  _id: '65f1c0ffee000000000000aa',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  avatarUrl: null,
  timezone: 'UTC',
  status: 'active',
})

/**
 * Seed an authenticated session without touching the network.
 * Use in tests that exercise authenticated screens.
 */
export function signInForTest({
  user = testUser,
  token = 'test-access-token',
  expiresIn = 900,
} = {}) {
  act(() => {
    setAccessToken(token, expiresIn)
    useAuthStore.setState({
      user,
      status: AUTH_STATUS.authenticated,
      endedReason: null,
      emailVerificationRequired: false,
    })
  })
}

/** Put the store back to "not signed in", with no in-memory token. */
export function signOutForTest() {
  act(() => {
    __resetTokenStoreForTests()
    __resetRefreshStateForTests()
    useAuthStore.setState({
      user: null,
      status: AUTH_STATUS.unauthenticated,
      endedReason: null,
      emailVerificationRequired: false,
    })
  })
}

/** Reset to the initial pre-bootstrap state (`idle`). */
export function resetAuthForTest() {
  act(() => {
    __resetTokenStoreForTests()
    __resetRefreshStateForTests()
    useAuthStore.setState({
      user: null,
      status: AUTH_STATUS.idle,
      endedReason: null,
      emailVerificationRequired: false,
    })
  })
}
