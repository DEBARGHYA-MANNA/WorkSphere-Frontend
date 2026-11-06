import { Link, useLocation } from 'react-router-dom'
import { PRIMARY_NAV, SETTINGS_NAV, isRouteActive } from '@/app/router/route-paths'
import { getNavIcon } from '@/app/router/icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Nav row shared by the desktop rail and the mobile drawer.
 * `collapsed` swaps the label for a tooltip so the rail stays usable.
 */
function NavRow({ item, collapsed = false, onNavigate }) {
  const Icon = getNavIcon(item.icon)
  const { pathname } = useLocation()
  // Section-aware matching: /projects/123 keeps "Projects" highlighted, while
  // /dashboard never claims nested routes.
  const active = isRouteActive(pathname, item.to)

  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[0.8125rem] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? <span className="sr-only">{item.label}</span> : null}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Full sidebar body: brand, organization switcher, primary nav, footer actions.
 * Presentational — the parent supplies organization context and navigation state.
 */
export function SidebarNav({
  collapsed = false,
  organizations,
  activeOrganization,
  onSelectOrganization,
  onCreateOrganization,
  onNavigate,
  isLoadingOrganizations,
  footer,
  header,
  className,
  organizationSwitcher: Switcher,
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {header ? <div className="shrink-0 px-2 pt-3">{header}</div> : null}

      {Switcher ? (
        <div className="shrink-0 px-2 pt-2">
          <Switcher
            organizations={organizations}
            activeOrganization={activeOrganization}
            onSelect={onSelectOrganization}
            onCreate={onCreateOrganization}
            isLoading={isLoadingOrganizations}
            collapsed={collapsed}
          />
        </div>
      ) : null}

      <nav aria-label="Primary" className="mt-4 min-h-0 flex-1 overflow-y-auto px-2">
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.key}>
              <NavRow item={item} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        {!collapsed ? (
          <>
            <p className="mb-1 mt-5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-sidebar-muted">
              Workspace
            </p>
            <ul className="space-y-0.5">
              {SETTINGS_NAV.map((item) => (
                <li key={item.key}>
                  <NavRow item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </nav>

      {footer ? <div className="shrink-0 border-t border-sidebar-border p-2">{footer}</div> : null}
    </div>
  )
}
