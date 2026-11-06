import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { createHttpClient } from '@/services/http/client'
import {
  __resetRefreshStateForTests,
  attachInterceptors,
  normaliseError,
  subscribeToSession,
} from '@/services/http/interceptors'
import {
  __resetTokenStoreForTests,
  getAccessToken,
  setAccessToken,
} from '@/services/http/token-store'
import { ApiErrorCode } from '@/lib/api-error'

/**
 * These specs exercise the real Axios instance with an adapter-level stub, so the
 * interceptors, envelope handling, and error normalisation all run.
 */
function stubClient(handler) {
  const client = createHttpClient()
  client.defaults.adapter = async (config) => handler(config)
  const detach = attachInterceptors(client)
  return { client, detach }
}

const ok = (config, data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
})

const unauthorised = (config) => ({
  data: { success: false, message: 'Authentication required', error: { code: 'UNAUTHENTICATED' } },
  status: 401,
  statusText: 'Unauthorized',
  headers: {},
  config,
})

/** Turn a non-2xx response into the rejection Axios would produce. */
function reject(config, response) {
  const error = new Error(`Request failed with status code ${response.status}`)
  error.config = config
  error.response = response
  error.isAxiosError = true
  return Promise.reject(error)
}

beforeEach(() => {
  __resetTokenStoreForTests()
  __resetRefreshStateForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('request interceptor', () => {
  it('attaches the in-memory bearer token', async () => {
    setAccessToken('token-abc', 900)
    let seenAuth
    const { client } = stubClient((config) => {
      seenAuth = config.headers.Authorization
      return ok(config, { success: true, data: {} })
    })

    await client.get('/projects')
    expect(seenAuth).toBe('Bearer token-abc')
  })

  it('omits the header on skipAuth requests', async () => {
    setAccessToken('token-abc', 900)
    let seenAuth = 'unset'
    const { client } = stubClient((config) => {
      seenAuth = config.headers.Authorization
      return ok(config, { success: true, data: {} })
    })

    await client.post('/auth/login', {}, { skipAuth: true })
    expect(seenAuth).toBeUndefined()
  })

  it('sends cookies with credentials enabled', async () => {
    let withCredentials
    const { client } = stubClient((config) => {
      withCredentials = config.withCredentials
      return ok(config, { success: true, data: {} })
    })

    await client.post('/auth/refresh', null)
    expect(withCredentials).toBe(true)
  })
})

describe('single-flight refresh', () => {
  it('issues exactly one refresh for parallel 401s', async () => {
    setAccessToken('stale-token', 900)
    let refreshCalls = 0
    let resourceCalls = 0

    const { client } = stubClient((config) => {
      if (config.url.includes('/auth/refresh')) {
        refreshCalls += 1
        // Small delay so the other requests arrive while it is still in flight.
        return new Promise((resolve) =>
          setTimeout(
            () => resolve(ok(config, { success: true, data: { accessToken: 'fresh-token' } })),
            15,
          ),
        )
      }
      resourceCalls += 1
      // Reject the first attempt with each token; succeed once refreshed.
      if (config.headers.Authorization === 'Bearer fresh-token') {
        return ok(config, { success: true, data: { ok: true } })
      }
      return reject(config, unauthorised(config))
    })

    const results = await Promise.all([
      client.get('/organizations'),
      client.get('/projects'),
      client.get('/members'),
    ])

    // The whole point: one refresh, not three (parallel rotations would trip the
    // backend's reuse detection and revoke the session).
    expect(refreshCalls).toBe(1)
    expect(resourceCalls).toBe(6) // 3 initial 401s + 3 successful retries
    expect(results.every((r) => r.status === 200)).toBe(true)
    expect(getAccessToken()).toBe('fresh-token')
  })

  it('retries a failed request at most once', async () => {
    setAccessToken('stale-token', 900)
    let resourceCalls = 0

    const { client } = stubClient((config) => {
      if (config.url.includes('/auth/refresh')) {
        return ok(config, { success: true, data: { accessToken: 'fresh-token' } })
      }
      resourceCalls += 1
      return reject(config, unauthorised(config))
    })

    await expect(client.get('/projects')).rejects.toMatchObject({ status: 401 })
    // Original attempt + one retry, then it gives up instead of looping.
    expect(resourceCalls).toBe(2)
  })

  it('never attempts a refresh for the refresh or login endpoints', async () => {
    let refreshCalls = 0
    const { client } = stubClient((config) => {
      if (config.url.includes('/auth/refresh')) refreshCalls += 1
      if (config.url.includes('/auth/login')) return reject(config, unauthorised(config))
      return ok(config, { success: true, data: {} })
    })

    await expect(client.post('/auth/login', {})).rejects.toMatchObject({ status: 401 })
    expect(refreshCalls).toBe(0)
  })

  it('clears the session and emits "expired" when refresh fails', async () => {
    setAccessToken('stale-token', 900)
    const events = []
    const unsubscribe = subscribeToSession((event) => events.push(event.type))

    const { client } = stubClient((config) => {
      if (config.url.includes('/auth/refresh')) {
        return reject(config, {
          data: { success: false, message: 'Refresh token is invalid or expired' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        })
      }
      return reject(config, unauthorised(config))
    })

    await expect(client.get('/projects')).rejects.toMatchObject({ status: 401 })

    expect(events).toContain('expired')
    expect(getAccessToken()).toBeNull()
    unsubscribe()
  })

  it('allows a later refresh after an earlier one failed', async () => {
    setAccessToken('stale-token', 900)
    let refreshCalls = 0

    const { client } = stubClient((config) => {
      if (config.url.includes('/auth/refresh')) {
        refreshCalls += 1
        if (refreshCalls === 1) {
          return reject(config, {
            data: { success: false, message: 'nope' },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
          })
        }
        return ok(config, { success: true, data: { accessToken: 'fresh-token' } })
      }
      if (config.headers.Authorization === 'Bearer fresh-token') {
        return ok(config, { success: true, data: {} })
      }
      return reject(config, unauthorised(config))
    })

    await expect(client.get('/projects')).rejects.toMatchObject({ status: 401 })

    setAccessToken('stale-token-2', 900)
    await expect(client.get('/projects')).resolves.toMatchObject({ status: 200 })
    expect(refreshCalls).toBe(2)
  })
})

describe('response envelope', () => {
  it('leaves unwrapping to the caller but keeps the payload intact', async () => {
    const { client } = stubClient((config) =>
      ok(config, { success: true, data: { items: [1, 2] }, pagination: { total: 2 } }),
    )
    const response = await client.get('/projects')
    expect(response.data.data.items).toEqual([1, 2])
  })
})

describe('normaliseError', () => {
  it('maps cancellation to a CANCELED code without a scary message', () => {
    const error = new axios.Cancel('canceled')
    const normalised = normaliseError(error)
    expect(normalised.code).toBe(ApiErrorCode.CANCELED)
    expect(normalised.isCanceled).toBe(true)
  })

  it('maps a timeout to TIMEOUT', () => {
    const normalised = normaliseError({
      code: 'ECONNABORTED',
      message: 'timeout of 20000ms exceeded',
    })
    expect(normalised.code).toBe(ApiErrorCode.TIMEOUT)
  })

  it('maps a missing response to NETWORK', () => {
    const normalised = normaliseError({ message: 'Network Error' })
    expect(normalised.code).toBe(ApiErrorCode.NETWORK)
  })

  it('extracts field errors and the request id from a validation envelope', () => {
    const normalised = normaliseError({
      response: {
        status: 400,
        headers: { 'x-request-id': 'req-1' },
        data: {
          success: false,
          message: 'Request validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            details: [{ field: 'title', message: 'title is required' }],
          },
          requestId: 'req-1',
        },
      },
    })

    expect(normalised.status).toBe(400)
    expect(normalised.isValidationError).toBe(true)
    expect(normalised.details).toEqual({ title: 'title is required' })
    expect(normalised.requestId).toBe('req-1')
    expect(normalised.serverCode).toBe('VALIDATION_ERROR')
    expect(normalised.message).toBe('Request validation failed')
  })

  it('never surfaces a 5xx internal message', () => {
    const normalised = normaliseError({
      response: {
        status: 500,
        headers: {},
        data: { success: false, message: 'MongoServerError: duplicate key at users.email_1' },
      },
    })

    expect(normalised.message).not.toMatch(/MongoServerError/)
    expect(normalised.code).toBe(ApiErrorCode.SERVER)
  })

  it('is idempotent for already-normalised errors', () => {
    const original = normaliseError({ response: { status: 404, data: {}, headers: {} } })
    expect(normaliseError(original)).toBe(original)
  })
})
