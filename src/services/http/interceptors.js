import axios from 'axios'
import { logger } from '@/lib/logger'
import { ApiError, ApiErrorCode, codeForStatus, fallbackMessageFor } from '@/lib/api-error'
import { extractEnvelopeMessage, extractFieldErrors, unwrap } from '@/services/http/envelope'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeToAccessToken,
} from '@/services/http/token-store'

/* -------------------------------------------------------------------------- */
/* Session event bus                                                          */
/* -------------------------------------------------------------------------- */

const sessionListeners = new Set()

/**
 * Subscribe to session lifecycle events.
 * Events: `'refreshed'` (new access token), `'expired'` (refresh failed or the
 * session was revoked — the app must leave authenticated screens).
 */
export function subscribeToSession(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

function emitSessionEvent(type, payload) {
  for (const listener of sessionListeners) listener({ type, ...payload })
}

/* -------------------------------------------------------------------------- */
/* Error normalisation                                                        */
/* -------------------------------------------------------------------------- */

/** Requests that must never trigger a refresh attempt. */
const REFRESH_EXEMPT_PATHS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout']

function requestPath(config) {
  const url = config?.url ?? ''
  return url.startsWith('http') ? new URL(url).pathname : url
}

function isRefreshExempt(config) {
  const path = requestPath(config)
  return REFRESH_EXEMPT_PATHS.some((exempt) => path.includes(exempt))
}

/**
 * Convert any Axios failure into an `ApiError` carrying a safe message, a stable
 * code, field errors, and the backend request id.
 */
export function normaliseError(error) {
  if (error?.isApiError) return error

  // Cancellation is control flow, not a failure to show the user.
  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
    return new ApiError({ message: 'Request canceled.', code: ApiErrorCode.CANCELED })
  }

  const response = error?.response

  if (!response) {
    const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message ?? '')
    const code = isTimeout ? ApiErrorCode.TIMEOUT : ApiErrorCode.NETWORK
    return new ApiError({ message: fallbackMessageFor(code), code })
  }

  const { status, data, headers } = response
  const code = codeForStatus(status)
  const requestId = data?.requestId || headers?.['x-request-id'] || undefined

  // Prefer the backend's own message for 4xx (it is written for humans and is
  // safe); never surface 5xx internals.
  const envelopeMessage = extractEnvelopeMessage(data)
  // Only 4xx messages are written for humans and safe to display. A 5xx message
  // often leaks internals (e.g. a raw MongoDB error), so it is kept aside as
  // `serverMessage` for diagnostics only.
  const message = (status < 500 && envelopeMessage) || fallbackMessageFor(code)

  if (status >= 500) {
    logger.error('API server error', status, requestId, envelopeMessage ?? '')
  }

  return new ApiError({
    message,
    status,
    // `code` is our normalised enum so `isValidationError`/`isForbidden`/… work
    // uniformly; the backend's more specific code is preserved separately.
    code,
    serverCode: data?.error?.code ?? null,
    serverMessage: envelopeMessage ?? null,
    details: extractFieldErrors(data) ?? data?.error?.details ?? null,
    requestId,
  })
}

/* -------------------------------------------------------------------------- */
/* Single-flight refresh                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One refresh in flight at a time. Every 401 that arrives while a refresh is
 * running awaits the same promise instead of firing its own `/auth/refresh`,
 * which would rotate the cookie concurrently and trip the backend's refresh-token
 * reuse detection (revoking the whole session).
 */
let refreshPromise = null

/** Broadcast a stored token to other tabs without persisting it. */
function broadcastToken(token, expiresIn) {
  try {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('worksphere-auth')
    channel.postMessage({ type: 'token', token, expiresIn })
    channel.close()
  } catch {
    /* BroadcastChannel unavailable — single-tab behaviour still works. */
  }
}

/**
 * Refresh the access token using the HttpOnly cookie.
 *
 * @param {import('axios').AxiosInstance} client
 * @returns {Promise<string>} the new access token
 */
export function refreshAccessToken(client) {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      // `skipAuth` matters: sending a dead bearer token alongside the cookie is
      // noise, and this call must not recurse into the 401 handler.
      const response = await client.post('/auth/refresh', null, {
        skipAuth: true,
        _isRefresh: true,
      })
      const data = unwrap(response.data) ?? {}
      if (!data.accessToken) {
        throw new ApiError({
          message: fallbackMessageFor(ApiErrorCode.UNAUTHORIZED),
          status: 401,
          code: ApiErrorCode.UNAUTHORIZED,
        })
      }
      setAccessToken(data.accessToken, data.accessTokenExpiresIn)
      broadcastToken(data.accessToken, data.accessTokenExpiresIn)
      emitSessionEvent('refreshed', { user: data.user })
      return data.accessToken
    } finally {
      // Cleared in `finally` so a failed refresh does not poison later attempts.
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/** Is a refresh currently running? (Used by tests and the auth bootstrap.) */
export function isRefreshing() {
  return Boolean(refreshPromise)
}

/**
 * Install the response interceptor: normalise errors, retry once after a
 * successful refresh, and broadcast session expiry when refresh fails.
 */
export function attachInterceptors(client) {
  const responseInterceptor = client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error?.config
      const status = error?.response?.status

      if (status !== 401 || !original || original._retried || isRefreshExempt(original)) {
        throw normaliseError(error)
      }

      // Retry at most once per request after a successful refresh.
      original._retried = true

      try {
        const token = await refreshAccessToken(client)
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        return client.request(original)
      } catch {
        // Refresh failed: the session is genuinely over.
        clearAccessToken()
        emitSessionEvent('expired', { reason: 'refresh_failed' })
        throw normaliseError(error)
      }
    },
  )

  return () => client.interceptors.response.eject(responseInterceptor)
}

/**
 * Cross-tab token hand-off.
 *
 * Access tokens are never persisted, so a brand-new tab starts with none. It
 * asks its siblings over BroadcastChannel — the token then exists only in memory
 * and the HttpOnly cookie remains the durable credential.
 *
 * @returns {() => void} cleanup function
 */
export function attachCrossTabSync() {
  if (typeof BroadcastChannel === 'undefined') return () => {}

  const channel = new BroadcastChannel('worksphere-auth')
  let unsubscribeToken = null

  channel.onmessage = (event) => {
    const message = event.data
    if (!message || typeof message !== 'object') return

    if (message.type === 'token' && message.token && !getAccessToken()) {
      setAccessToken(message.token, message.expiresIn)
      // Keep following rotations from this tab for the rest of the session.
      if (unsubscribeToken) unsubscribeToken()
      unsubscribeToken = subscribeToAccessToken(() => {})
    }

    if (message.type === 'request-token' && getAccessToken()) {
      channel.postMessage({ type: 'token', token: getAccessToken() })
    }

    if (message.type === 'logout') {
      clearAccessToken()
      emitSessionEvent('expired', { reason: 'signed_out_elsewhere' })
    }
  }

  // Announce ourselves so an already-authenticated tab can hand over a token.
  channel.postMessage({ type: 'request-token' })

  return () => {
    if (unsubscribeToken) unsubscribeToken()
    channel.close()
  }
}

/** Broadcast a sign-out to sibling tabs. */
export function broadcastLogout() {
  try {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('worksphere-auth')
    channel.postMessage({ type: 'logout' })
    channel.close()
  } catch {
    /* no-op */
  }
}

/** Test hook: drop any in-flight refresh promise. */
export function __resetRefreshStateForTests() {
  refreshPromise = null
  sessionListeners.clear()
}
