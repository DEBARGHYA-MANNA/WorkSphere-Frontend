import { httpClient } from '@/services/http/client'
import { extractList, extractPagination, unwrap } from '@/services/http/envelope'

/**
 * Organization endpoints.
 *
 * Contract: backend OpenAPI tag "Organizations" plus
 * `src/modules/organizations/organization.validation.js`.
 *
 * The API returns Mongo documents, whose primary key is `_id`. The UI works with
 * `id`, so every record is normalised here — one place, so no component has to
 * remember which one to read.
 */

/** Add `id` alongside the raw `_id` without discarding anything. */
export function withId(record) {
  if (!record || typeof record !== 'object') return record
  return record.id ? record : { ...record, id: record._id }
}

/** `GET /organizations?page&limit` — memberships only. */
export async function listOrganizations({ page = 1, limit = 20, signal } = {}) {
  const response = await httpClient.get('/organizations', { params: { page, limit }, signal })
  return {
    items: extractList(response.data).map(withId),
    pagination: extractPagination(response.data),
  }
}

/**
 * `GET /organizations/:organizationId`
 * data: { organization, membership: { role } }
 */
export async function getOrganization(organizationId, { signal } = {}) {
  const response = await httpClient.get(`/organizations/${organizationId}`, { signal })
  const data = unwrap(response.data) ?? {}
  return {
    organization: withId(data.organization),
    membership: data.membership ?? null,
  }
}

/**
 * `POST /organizations` → 201
 * data: { organization, membership } — the creator becomes Owner atomically.
 */
export async function createOrganization({ name, description, settings }) {
  const payload = { name }
  if (description !== undefined) payload.description = description
  if (settings && Object.keys(settings).length > 0) payload.settings = settings

  const response = await httpClient.post('/organizations', payload)
  const data = unwrap(response.data) ?? {}
  return {
    organization: withId(data.organization),
    membership: data.membership ?? null,
  }
}

/**
 * `PATCH /organizations/:organizationId` — Owner/Admin only.
 * `settings` must contain at least one property when sent.
 */
export async function updateOrganization(organizationId, changes) {
  const response = await httpClient.patch(`/organizations/${organizationId}`, changes)
  const data = unwrap(response.data) ?? {}
  return { organization: withId(data.organization) }
}

/**
 * `POST /organizations/:organizationId/switch`
 * Validates membership server-side and echoes the selected context. It does not
 * mint a new token — the tenant is carried by the URL — so the client stores the
 * choice and re-scopes its queries.
 */
export async function switchOrganization(organizationId) {
  const response = await httpClient.post(`/organizations/${organizationId}/switch`)
  const data = unwrap(response.data) ?? {}
  return {
    organization: withId(data.organization),
    membership: data.membership ?? null,
  }
}

/** `DELETE /organizations/:organizationId` — Owner only. */
export async function deleteOrganization(organizationId) {
  const response = await httpClient.delete(`/organizations/${organizationId}`)
  return unwrap(response.data)
}

export const organizationService = {
  list: listOrganizations,
  get: getOrganization,
  create: createOrganization,
  update: updateOrganization,
  switch: switchOrganization,
  remove: deleteOrganization,
}

export default organizationService
