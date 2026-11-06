import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { OrganizationSwitcher } from '@/components/layout/organization-switcher'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Desktop sidebar: fixed rail that collapses to icons.
 *
 * Collapse state lives in the persisted UI store so it survives reloads. The
 * rail is hidden below `lg`, where `MobileNav` takes over.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  organizations,
  activeOrganization,
  onSelectOrganization,
  onCreateOrganization,
  isLoadingOrganizations,
  onNavigate,
}) {
  return (
    <aside
      aria-label="Sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out-expo lg:flex',
        collapsed ? 'w-[4.5rem]' : 'w-[16.5rem]',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-2' : 'justify-between px-3',
        )}
      >
        <Logo showText={!collapsed} size="sm" />
        {!collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleCollapsed}
                aria-label="Collapse sidebar"
                className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <PanelLeftClose aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <SidebarNav
        collapsed={collapsed}
        organizations={organizations}
        activeOrganization={activeOrganization}
        onSelectOrganization={onSelectOrganization}
        onCreateOrganization={onCreateOrganization}
        isLoadingOrganizations={isLoadingOrganizations}
        onNavigate={onNavigate}
        organizationSwitcher={OrganizationSwitcher}
        footer={
          collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleCollapsed}
                  aria-label="Expand sidebar"
                  className="mx-auto flex text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <PanelLeftOpen aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : null
        }
      />
    </aside>
  )
}
