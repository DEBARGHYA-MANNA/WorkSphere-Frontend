/**
 * API envelope helpers.
 *
 * The backend returns its payloads inside a wrapper of the shape:
 *   { success: true, data: <payload>, message?: string, meta?: {...} }
 * but a few endpoints (and any future raw endpoint) may return the payload
 * directly. These helpers normalise both without guessing at shapes.
 */

/**
 * Unwrap an envelope. If the object looks like an envelope, return `data`;
 * otherwise return the value unchanged.
 *
 * @template T
 * @param {any} body
 * @returns {T}
 */
export function unwrap(body) {
  if (body === null || body === undefined) return body
  if (typeof body !== 'object' || Array.isArray(body)) return body

  const hasEnvelopeShape =
    Object.prototype.hasOwnProperty.call(body, 'success') ||
    (Object.prototype.hasOwnProperty.call(body, 'data') &&
      Object.keys(body).some((key) => ['message', 'meta', 'pagination', 'errors'].includes(key)))

  if (hasEnvelopeShape) return body.data
  return body
}

/**
 * Extract pagination/meta information from an envelope.
 * Supports the common `meta` and `pagination` placements.
 *
 * @param {any} body
 * @returns {{page:number, limit:number, total:number, totalPages:number, hasNextPage:boolean, hasPreviousPage:boolean}|null}
 */
export function extractPagination(body) {
  if (!body || typeof body !== 'object') return null
  const raw = body.meta?.pagination || body.pagination || body.meta || null
  if (!raw || typeof raw !== 'object') return null

  const page = Number(raw.page ?? raw.currentPage ?? 1)
  const limit = Number(raw.limit ?? raw.pageSize ?? raw.perPage ?? 0)
  const total = Number(raw.total ?? raw.totalItems ?? raw.count ?? 0)
  const totalPages =
    Number(raw.totalPages ?? raw.pages ?? 0) || (limit > 0 ? Math.ceil(total / limit) : 0)

  if (!Number.isFinite(page) && !Number.isFinite(total)) return null

  return {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 0,
    total: Number.isFinite(total) ? total : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
    hasNextPage: Boolean(raw.hasNextPage ?? (totalPages ? page < totalPages : false)),
    hasPreviousPage: Boolean(raw.hasPreviousPage ?? page > 1),
  }
}

/**
 * Pull a list out of a body that may be:
 *   - an array
 *   - `{ items: [...] }` / `{ results: [...] }` / `{ data: [...] }`
 * Always returns an array so list views never crash on an unexpected shape.
 */
export function extractList(body) {
  const data = unwrap(body)
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    for (const key of ['items', 'results', 'records', 'rows', 'data', 'list']) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  return []
}

/**
 * Extract a user-safe message from an error envelope.
 * Understands `{ message }`, `{ error }`, `{ error: { message } }` and
 * `{ errors: [{ message }] }` shapes without exposing internals.
 */
export function extractEnvelopeMessage(body) {
  if (!body) return undefined
  if (typeof body === 'string') return body
  if (typeof body !== 'object') return undefined

  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
  if (typeof body.error === 'string' && body.error.trim()) return body.error.trim()
  if (body.error && typeof body.error === 'object') {
    if (typeof body.error.message === 'string' && body.error.message.trim()) {
      return body.error.message.trim()
    }
  }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0]
    if (typeof first === 'string') return first
    if (first && typeof first.message === 'string') return first.message
  }
  return undefined
}

/**
 * Extract field-level validation errors as `{ field: message }`.
 * Understands `{ errors: [...] }`, `{ details: [...] }` (class-validator style)
 * and `{ fieldErrors: {...} }`.
 */
export function extractFieldErrors(body) {
  if (!body || typeof body !== 'object') return null

  // Backend shape: { error: { details: [{ field, message }] } }
  // Unwrap one level so callers get a flat field map.
  if (body.error && typeof body.error === 'object' && body.error.details) {
    const fromError = extractFieldErrors({ details: body.error.details })
    if (fromError) return fromError
  }

  if (body.fieldErrors && typeof body.fieldErrors === 'object') {
    const mapped = {}
    for (const [key, value] of Object.entries(body.fieldErrors)) {
      mapped[key] = Array.isArray(value) ? value[0] : String(value)
    }
    return Object.keys(mapped).length ? mapped : null
  }

  const list = Array.isArray(body.errors)
    ? body.errors
    : Array.isArray(body.details)
      ? body.details
      : null
  if (!list) return null

  const mapped = {}
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue
    const field = entry.field ?? entry.property ?? entry.path
    const message = entry.message ?? (Array.isArray(entry.messages) ? entry.messages[0] : undefined)
    if (field && message && !mapped[field]) mapped[field] = message
  }
  return Object.keys(mapped).length ? mapped : null
}
