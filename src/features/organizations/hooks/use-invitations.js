import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/constants'
import { invitationService } from '@/services/invitation-service'
import { useAuthStore } from '@/features/auth/auth-store'
import { useUiStore } from '@/stores/ui-store'

/** `GET /organizations/:id/invitations` — pending, unexpired invitations only. */
export function useInvitations(organizationId) {
  return useQuery({
    queryKey: [QUERY_KEYS.invitations, organizationId, { page: 1, limit: 50 }],
    queryFn: ({ signal }) => invitationService.list(organizationId, { page: 1, limit: 50, signal }),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  })
}

/**
 * `POST /organizations/:id/invitations`.
 *
 * The response carries no token — the invitation link exists only inside the
 * email — so the success copy must not promise that the recipient received it.
 */
export function useCreateInvitation(organizationId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values) => invitationService.create(organizationId, values),
    onSuccess: ({ invitation }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.invitations, organizationId] })
      toast.success(`Invitation created for ${invitation?.email ?? 'the recipient'}`, {
        description:
          'Email delivery depends on the backend mail transport. The invite link cannot be shown here — it is never returned by the API.',
      })
    },
  })
}

/** `DELETE /organizations/:id/invitations/:invitationId` */
export function useRevokeInvitation(organizationId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId) => invitationService.revoke(organizationId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.invitations, organizationId] })
      toast.success('Invitation revoked')
    },
  })
}

/**
 * `POST /invitations/accept` — requires an authenticated session whose email
 * matches the invitation. On success the organization becomes the active context,
 * because that is where the user just gained access.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (values) => invitationService.accept(values),
    onSuccess: ({ organization }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.organizations] })
      if (organization?.id) setActiveOrganizationId(organization.id)
      // Membership changed; refresh the profile so any role-derived UI updates.
      if (setUser && useAuthStore.getState().user) {
        setUser(useAuthStore.getState().user)
      }
      toast.success(`You joined ${organization?.name ?? 'the organization'}`)
    },
  })
}
