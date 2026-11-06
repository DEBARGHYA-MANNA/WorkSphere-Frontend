import axios from 'axios'
import { env } from '@/lib/env'
import { getAccessToken } from '@/services/http/token-store'

/**
 * Central Axios instance.
 *
 * Conventions enforced here (see `interceptors.js` for behaviour):
 *  - `withCredentials`: the HttpOnly refresh cookie must travel on
 *    `/auth/refresh` and `/auth/logout`. The cookie is `SameSite=lax` and scoped
 *    to `Path=/api/v1/auth`, which is why the app is served same-origin.
 *  - A bounded timeout so a hung request cannot wedge a screen forever.
 *  - An `AbortSignal` is passed through so navigating away cancels work.
 */
export function createHttpClient(overrides = {}) {
  const client = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: env.apiTimeout,
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    // Only JSON bodies are sent; leave form-data/URLSearchParams untouched.
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          delete headers['Content-Type']
          return data
        }
        if (data === undefined) return undefined
        return JSON.stringify(data)
      },
    ],
    ...overrides,
  })

  // Attach the in-memory bearer token to every outgoing request.
  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token && !config.skipAuth) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return client
}

/** Shared application client. */
export const httpClient = createHttpClient()
