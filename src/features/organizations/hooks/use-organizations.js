import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { useUiStore } from '@/stores/ui-store'
import { useAuthStore } from '@/features/auth/auth-store'
import { organizationService } from '@/services/organization-service'
import { toast } from 'sonner'

/**
 * Organization list (memberships of the signed-in user).
 *
 * Scoped to the session: it only runs when authenticated, and it is cleared by
 * the session layer on sign-out, so one user's organizations never leak into
 * another's view.
 */
export function useOrganizationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')

  return useQuery({
    queryKey: [QUERY_KEYS.organizations, 'list'],
    queryFn: ({ signal }) => organizationService.list({ page: 1, limit: 100, signal }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

/**
 * Organization context for the shell.
 *
 * The persisted `activeOrganizationId` is a *hint*, never an authority: if it no
 * longer matches a membership (removed, revoked, or another device), we fall back
 * to the first membership instead of rendering a dead id.
 *
 * @returns {{
 *   organizations: Array,
 *   activeOrganization: object|null,
 *   activeOrganizationId: string|null,
 *   membershipRole: string|null,
 *   isLoading: boolean,
 *   isReady: boolean,
 *   isEmpty: boolean,
 *   selectOrganization: (id: string) => void,
 * }}
 */
export function useOrganizations() {
  const { data, isLoading, isError, error, refetch } = useOrganizationsQuery()
  const activeOrganizationId = useUiStore((state) => state.activeOrganizationId)
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)

  const organizations = useMemo(() => data?.items ?? [], [data])

  const activeOrganization = useMemo(() => {
    if (!organizations.length) return null
    return organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0] ?? null
  }, [organizations, activeOrganizationId])

  return {
    organizations,
    activeOrganization,
    activeOrganizationId: activeOrganization?.id ?? null,
    membershipRole: activeOrganization?.role ?? null,
    isLoading,
    isReady: !isLoading,
    isEmpty: !isLoading && !isError && organizations.length === 0,
    isError,
    error,
    refetch,
    selectOrganization: setActiveOrganizationId,
  }
}

/**
 * `POST /organizations` — creator becomes Owner.
 * On success the new organization is selected immediately, because that is
 * unambiguously what the user wants next.
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)

  return useMutation({
    mutationFn: (values) => organizationService.create(values),
    onSuccess: ({ organization }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.organizations] })
      if (organization?.id) setActiveOrganizationId(organization.id)
      toast.success(`Organization "${organization?.name ?? ''}" created`)
    },
  })
}

/** `PATCH /organizations/:id` — Owner/Admin. */
export function useUpdateOrganization(organizationId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes) => organizationService.update(organizationId, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.organizations] })
      toast.success('Organization updated')
    },
  })
}

/**
 * Switch the active organization.
 *
 * The backend validates membership via `POST /:id/switch`, but the tenant is
 * carried by the URL, not by a token — so switching is primarily a client-side
 * scope change. We call the endpoint to confirm access, then reset cached data
 * that belonged to the previous organization.
 */
export function useSwitchOrganization() {
  const queryClient = useQueryClient()
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)

  return useMutation({
    mutationFn: (organizationId) => organizationService.switch(organizationId),
    onSuccess: (_data, organizationId) => {
      setActiveOrganizationId(organizationId)
      // Everything tenant-scoped is now stale.
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.projects] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.tasks] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.members] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.invitations] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.notifications] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.analytics] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.organizations] })
    },
  })
}

/** `DELETE /organizations/:id` — Owner only. */
export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)

  return useMutation({
    mutationFn: (organizationId) => organizationService.remove(organizationId),
    onSuccess: () => {
      // The current context is gone; the list query decides the next one.
      setActiveOrganizationId(null)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.organizations] })
      toast.success('Organization deleted')
    },
  })
}

/** Convenience wrapper used by the switcher's "create" action. */
export function useOrganizationSwitcher() {
  const { organizations, activeOrganization, selectOrganization } = useOrganizations()
  const switchMutation = useSwitchOrganization()

  const onSelect = useCallback(
    (organizationId) => {
      if (!organizationId || organizationId === activeOrganization?.id) return
      switchMutation.mutate(organizationId)
    },
    [activeOrganization?.id, switchMutation],
  )

  return { organizations, activeOrganization, selectOrganization, onSelect, switchMutation }
}
