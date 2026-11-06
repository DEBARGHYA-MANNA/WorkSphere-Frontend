import { ROUTES } from '@/lib/constants'

/** Query parameter used to carry the intended destination through a login. */
export const REDIRECT_PARAM = 'redirect'

/**
 * Sanitise a post-login destination.
 *
 * Only same-origin, absolute *path* values are accepted. Anything that could
 * become an open redirect (`https://evil.test`, `//evil.test`, `/\evil.test`,
 * `javascript:…`) falls back to the dashboard.
 *
 * @param {string|null|undefined} value raw value from the query string
 * @param {string} [fallback]
 * @returns {string} a safe internal path
 */
export function safeRedirect(value, fallback = ROUTES.dashboard) {
  if (typeof value !== 'string') return fallback

  const candidate = value.trim()
  if (!candidate) return fallback

  // Must be an absolute path, not a protocol-relative or absolute URL.
  if (!candidate.startsWith('/')) return fallback
  // `//host` and `/\host` are treated as protocol-relative by browsers.
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return fallback
  // Reject control characters and whitespace tricks.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F\s]/.test(candidate)) return fallback

  try {
    // Resolving against a fixed origin flattens any path tricks (`/a/../../b`).
    const resolved = new URL(candidate, 'https://worksphere.invalid')
    if (resolved.origin !== 'https://worksphere.invalid') return fallback

    const path = `${resolved.pathname}${resolved.search}${resolved.hash}`
    // Never send an authenticated user back to an auth screen.
    if (isAuthRoute(resolved.pathname)) return fallback
    return path
  } catch {
    return fallback
  }
}

/** Is this pathname one of the public authentication screens? */
export function isAuthRoute(pathname = '') {
  return [
    ROUTES.login,
    ROUTES.register,
    ROUTES.forgotPassword,
    ROUTES.resetPassword,
    ROUTES.acceptInvitation,
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

/** Build a login URL that returns to `from` afterwards. */
export function loginUrlWithRedirect(from) {
  const target = safeRedirect(from, '')
  if (!target || target === ROUTES.dashboard) return ROUTES.login
  return `${ROUTES.login}?${REDIRECT_PARAM}=${encodeURIComponent(target)}`
}
