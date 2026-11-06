/**
 * Environment configuration.
 *
 * Only `VITE_`-prefixed variables reach the browser, which means they are
 * public. Nothing secret may live here. See `.env.example`.
 */

function asString(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || fallback
}

function asNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Normalise the API base URL.
 *
 * The default (`/api/v1`) is deliberately same-origin: the browser calls the
 * app's own origin, Vite proxies `/api` to the backend in development, and the
 * reverse proxy does it in production. That keeps the HttpOnly refresh cookie
 * first-party, so no CORS credential juggling is needed.
 */
function normaliseBaseUrl(value) {
  const base = asString(value, '/api/v1')
  if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '')
  return `/${base.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

export const env = Object.freeze({
  apiBaseUrl: normaliseBaseUrl(import.meta.env.VITE_API_BASE_URL),
  apiTimeout: asNumber(import.meta.env.VITE_API_TIMEOUT, 20000),
  appName: asString(import.meta.env.VITE_APP_NAME, 'WorkSphere'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
})

/** Endpoint prefix used by every service module (e.g. `/api/v1`). */
export const API_PREFIX = env.apiBaseUrl
