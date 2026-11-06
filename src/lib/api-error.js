/**
 * Normalised API error.
 *
 * Every rejection that leaves the Axios client is an `ApiError`, so UI code
 * never has to care whether the failure came from the network, a timeout, an
 * HTTP status, or a validation envelope.
 */

export const ApiErrorCode = Object.freeze({
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CANCELED: 'CANCELED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
})

export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {string} params.message   Human readable message safe to display
   * @param {number} [params.status]  HTTP status (undefined for network errors)
   * @param {string} [params.code]    ApiErrorCode value
   * @param {object|string|null} [params.details] Validation details / raw payload
   * @param {string} [params.requestId]
   */
  constructor({ message, status, code = ApiErrorCode.UNKNOWN, details = null, requestId }) {
    super(message || 'Something went wrong. Please try again.')
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    this.isApiError = true
  }

  get isNetworkError() {
    return this.code === ApiErrorCode.NETWORK || this.code === ApiErrorCode.TIMEOUT
  }

  get isAuthError() {
    return this.status === 401 || this.code === ApiErrorCode.UNAUTHORIZED
  }

  get isForbidden() {
    return this.status === 403 || this.code === ApiErrorCode.FORBIDDEN
  }

  get isValidationError() {
    return this.code === ApiErrorCode.VALIDATION
  }

  get isNotFound() {
    return this.status === 404 || this.code === ApiErrorCode.NOT_FOUND
  }

  get isCanceled() {
    return this.code === ApiErrorCode.CANCELED
  }
}

/** Status → error code mapping. */
export function codeForStatus(status) {
  switch (status) {
    case 400:
      return ApiErrorCode.VALIDATION
    case 401:
      return ApiErrorCode.UNAUTHORIZED
    case 403:
      return ApiErrorCode.FORBIDDEN
    case 404:
      return ApiErrorCode.NOT_FOUND
    case 409:
      return ApiErrorCode.CONFLICT
    case 422:
      return ApiErrorCode.VALIDATION
    case 429:
      return ApiErrorCode.RATE_LIMITED
    default:
      return status >= 500 ? ApiErrorCode.SERVER : ApiErrorCode.UNKNOWN
  }
}

/** Friendly, non-leaking fallbacks per status code. */
const FALLBACK_MESSAGES = {
  [ApiErrorCode.NETWORK]: 'Cannot reach the server. Check your connection and try again.',
  [ApiErrorCode.TIMEOUT]: 'The request took too long. Please try again.',
  [ApiErrorCode.CANCELED]: 'Request canceled.',
  [ApiErrorCode.UNAUTHORIZED]: 'Your session has expired. Please sign in again.',
  [ApiErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ApiErrorCode.NOT_FOUND]: 'We could not find what you were looking for.',
  [ApiErrorCode.CONFLICT]: 'This conflicts with existing data. Please refresh and try again.',
  [ApiErrorCode.VALIDATION]: 'Please check the highlighted fields and try again.',
  [ApiErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [ApiErrorCode.SERVER]: 'The server ran into a problem. Please try again shortly.',
  [ApiErrorCode.UNKNOWN]: 'Something went wrong. Please try again.',
}

export function fallbackMessageFor(code) {
  return FALLBACK_MESSAGES[code] || FALLBACK_MESSAGES[ApiErrorCode.UNKNOWN]
}

/** Type guard that survives module duplication (checks the marker property). */
export function isApiError(error) {
  return Boolean(error && error.isApiError === true)
}

/** Extract a readable message from any thrown value. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (isApiError(error)) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
