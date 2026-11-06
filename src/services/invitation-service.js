import { httpClient } from '@/services/http/client'
import { extractList, extractPagination, unwrap } from '@/services/http/envelope'
import { withId } from '@/services/organization-service'

/**
 * Invitation endpoints.
 *
 * Contract: backend `src/modules/invitations/invitation.validation.js` and
 * `invitation.service.js`.
 *
 * Two facts drive the UI design:
 *
 *  1. The invitation **token is never returned by any endpoint** — it travels
 *     only inside the invitation email. The client therefore cannot display or
 *     copy an invite link; `InvitationService.create` returns the invitation
 *     record and no token.
 *  2. The backend's mailer is a no-op when no transport is configured
 *     (`src/services/mailer.js` logs a warning and returns). So delivery may
 *     silently not happen, and the UI must not claim an email was sent.
 */

/** `GET /organizations/:organizationId/invitations?page&limit` — pending only. */
export async function listInvitations(organizationId, { page = 1, limit = 20, signal } = {}) {
  const response = await httpClient.get(`/organizations/${organizationId}/invitations`, {
    params: { page, limit },
    signal,
  })
  return {
    items: extractList(response.data).map(withId),
    pagination: extractPagination(response.data),
  }
}

/**
 * `POST /organizations/:organizationId/invitations` → 201
 * `role` is optional; the backend falls back to the organization's
 * `settings.defaultMemberRole`.
 *
 * Errors worth handling explicitly:
 *   403 ROLE_ASSIGNMENT_FORBIDDEN  role above the caller's rank
 *   403 INVITATIONS_DISABLED       organization settings block member invites
 *   409 ALREADY_A_MEMBER           the email already has an active membership
 *   409 INVITATION_EXISTS          a pending invitation already exists
 */
export async function createInvitation(organizationId, { email, role }) {
  const payload = { email }
  if (role) payload.role = role

  const response = await httpClient.post(`/organizations/${organizationId}/invitations`, payload)
  const data = unwrap(response.data) ?? {}
  return { invitation: withId(data.invitation ?? data) }
}

/** `DELETE /organizations/:organizationId/invitations/:invitationId` */
export async function revokeInvitation(organizationId, invitationId) {
  const response = await httpClient.delete(
    `/organizations/${organizationId}/invitations/${invitationId}`,
  )
  return unwrap(response.data)
}

/**
 * `POST /invitations/accept` — authenticated, and the invitation's email must
 * match the signed-in account (the server enforces this).
 * data: { organization, membership }
 */
export async function acceptInvitation({ token }) {
  const response = await httpClient.post('/invitations/accept', { token })
  const data = unwrap(response.data) ?? {}
  return {
    organization: withId(data.organization),
    membership: data.membership ?? null,
  }
}

export const invitationService = {
  list: listInvitations,
  create: createInvitation,
  revoke: revokeInvitation,
  accept: acceptInvitation,
}

export default invitationService
