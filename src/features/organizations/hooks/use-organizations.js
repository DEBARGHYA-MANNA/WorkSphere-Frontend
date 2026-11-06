import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { useUiStore } from '@/stores/ui-store'

/**
 * Organization context for the shell.
 *
 * ── Phase boundary ─────────────────────────────────────────────────────────────
 * The backend exposes `GET /api/v1/organizations` (paged, memberships only), and
 * organization *management* lands in Phase 4. Until then the shell must render an
 * honest "no organization yet" state instead of inventing one, so this hook
 * returns an empty, clearly-labelled result.
 *
 * Phase 4 replaces the body of `useOrganizationsQuery` with a real
 * `organizationService.list()` call. Everything below — selection, the persisted
 * active id, and the return shape — stays identical, so no UI changes.
 * ───────────────────────────────────────────────────────────────────────────────
 */
function useOrganizationsQuery() {
  return useQuery({
    queryKey: [QUERY_KEYS.organizations, 'list'],
    queryFn: async () => ({ items: [], pagination: null }),
    // Nothing to fetch until Phase 4 wires the endpoint.
    enabled: false,
    initialData: { items: [], pagination: null },
    staleTime: Infinity,
  })
}

/**
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
  const { data, isLoading } = useOrganizationsQuery()
  const activeOrganizationId = useUiStore((state) => state.activeOrganizationId)
  const setActiveOrganizationId = useUiStore((state) => state.setActiveOrganizationId)

  const organizations = useMemo(() => data?.items ?? [], [data])

  // The persisted selection is only a hint: fall back to the first membership
  // when it no longer exists (removed, revoked) rather than rendering a dead id.
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
    isEmpty: !isLoading && organizations.length === 0,
    selectOrganization: setActiveOrganizationId,
  }
}
