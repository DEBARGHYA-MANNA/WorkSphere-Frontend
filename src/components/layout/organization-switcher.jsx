import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, initialsOf } from '@/lib/utils'

/**
 * Organization switcher in the sidebar header.
 *
 * States are explicit:
 *  - loading → skeleton row
 *  - empty   → "No organization yet" with the create CTA (Phase 4 performs it)
 *  - ready   → dropdown of memberships with the active one ticked
 *
 * With a single organization the control still renders (so the current context is
 * readable) but the menu explains that switching needs an invite.
 */
export function OrganizationSwitcher({
  organizations = [],
  activeOrganization,
  onSelect,
  onCreate,
  isLoading = false,
  collapsed = false,
  className,
}) {
  if (isLoading) {
    return (
      <div
        className={cn('flex h-10 items-center gap-2 rounded-lg px-2', className)}
        aria-busy="true"
      >
        <span className="sr-only">Loading organizations…</span>
        <span className="size-7 shrink-0 animate-pulse rounded-md bg-sidebar-accent" />
        {!collapsed ? <span className="h-3 w-28 animate-pulse rounded bg-sidebar-accent" /> : null}
      </div>
    )
  }

  const hasOrganizations = organizations.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors',
          'hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          'data-[state=open]:bg-sidebar-accent',
          collapsed && 'justify-center',
          className,
        )}
        aria-label={
          activeOrganization
            ? `Current organization: ${activeOrganization.name}. Change organization`
            : 'Select organization'
        }
      >
        {activeOrganization ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[0.625rem] font-semibold text-primary-foreground">
            {initialsOf(activeOrganization.name)}
          </span>
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-sidebar-border text-sidebar-muted">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
        )}

        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium text-sidebar-foreground">
                {activeOrganization?.name ?? 'No organization'}
              </span>
              {activeOrganization?.role ? (
                <span className="block truncate text-2xs text-sidebar-muted">
                  {activeOrganization.role}
                </span>
              ) : null}
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-sidebar-muted transition-colors group-hover:text-sidebar-foreground"
              aria-hidden="true"
            />
          </>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>

        {hasOrganizations ? (
          organizations.map((organization) => {
            const isActive = organization.id === activeOrganization?.id
            return (
              <DropdownMenuItem
                key={organization.id}
                onSelect={() => onSelect?.(organization.id)}
                className="gap-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary-muted text-[0.625rem] font-semibold text-accent-foreground">
                  {initialsOf(organization.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{organization.name}</span>
                  {organization.role ? (
                    <span className="block truncate text-2xs text-muted-foreground">
                      {organization.role}
                    </span>
                  ) : null}
                </span>
                {isActive ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
                {isActive ? <span className="sr-only">Current organization</span> : null}
              </DropdownMenuItem>
            )
          })
        ) : (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            You are not a member of any organization yet.
          </p>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onCreate?.()} className="gap-2 text-muted-foreground">
          <Plus className="size-4" aria-hidden="true" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
