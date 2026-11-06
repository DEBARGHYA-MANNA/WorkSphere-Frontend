import { httpClient } from '@/services/http/client'
import { unwrap } from '@/services/http/envelope'

/**
 * Authentication endpoints.
 *
 * Every path, payload, and response shape mirrors the backend OpenAPI document
 * (`/openapi.json`, tag "Authentication"). Nothing is guessed.
 *
 * The refresh token is never part of any response body the browser can read — it
 * arrives as an HttpOnly cookie scoped to `Path=/api/v1/auth`.
 */
export const authService = {
  /**
   * `POST /auth/register` → 201
   * data: { user, emailVerificationRequired }
   *
   * `emailVerificationRequired` is read from the response rather than assumed:
   * the backend ships with `EMAIL_VERIFICATION_ENABLED=false`, so users can sign
   * in immediately; when a mail transport is configured and the flag flips, the
   * same call reports `true` and the UI shows the "check your email" screen.
   */
  async register({ name, email, password }) {
    const response = await httpClient.post(
      '/auth/register',
      { name, email, password },
      {
        skipAuth: true,
      },
    )
    return unwrap(response.data) ?? {}
  },

  /**
   * `POST /auth/login` → 200
   * data: { accessToken, tokenType, accessTokenExpiresIn, user }
   * Also sets the HttpOnly refresh cookie.
   */
  async login({ email, password }) {
    const response = await httpClient.post('/auth/login', { email, password }, { skipAuth: true })
    return unwrap(response.data) ?? {}
  },

  /** `POST /auth/logout` → 200 — revokes the session and clears the cookie. */
  async logout() {
    const response = await httpClient.post('/auth/logout', null, { skipAuth: true })
    return unwrap(response.data)
  },

  /** `POST /auth/logout-all` → 200 — requires a valid access token. */
  async logoutAll() {
    const response = await httpClient.post('/auth/logout-all', null)
    return unwrap(response.data) ?? {}
  },

  /**
   * `POST /auth/forgot-password` → 200
   * The response is deliberately generic (no account enumeration). Password-reset
   * email delivery requires a configured mail adapter on the backend.
   */
  async forgotPassword({ email }) {
    const response = await httpClient.post('/auth/forgot-password', { email }, { skipAuth: true })
    return unwrap(response.data)
  },

  /** `POST /auth/reset-password` → 200 — single-use token, 32–256 chars. */
  async resetPassword({ token, password }) {
    const response = await httpClient.post(
      '/auth/reset-password',
      { token, password },
      {
        skipAuth: true,
      },
    )
    return unwrap(response.data)
  },

  /**
   * `POST /auth/verify-email` → 200 — inactive while
   * `EMAIL_VERIFICATION_ENABLED=false`; wired for when it is enabled.
   */
  async verifyEmail({ token }) {
    const response = await httpClient.post('/auth/verify-email', { token }, { skipAuth: true })
    return unwrap(response.data) ?? {}
  },

  /** `POST /auth/resend-verification` → 200 (generic response). */
  async resendVerification({ email }) {
    const response = await httpClient.post(
      '/auth/resend-verification',
      { email },
      { skipAuth: true },
    )
    return unwrap(response.data)
  },

  /** `GET /users/me` → 200 — data: { user }. */
  async me() {
    const response = await httpClient.get('/users/me')
    const data = unwrap(response.data) ?? {}
    return data.user ?? data
  },
}

export default authService
