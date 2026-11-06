import { Logo } from '@/components/common/logo'
import { OrganizationSwitcher } from '@/components/layout/organization-switcher'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

/**
 * Mobile navigation drawer.
 *
 * A full-height sheet rather than a shrunken desktop rail: rows are ≥ 44px tall
 * for touch, the close button is top-right, and the drawer closes on navigate.
 */
export function MobileNav({
  open,
  onOpenChange,
  organizations,
  activeOrganization,
  onSelectOrganization,
  onCreateOrganization,
  isLoadingOrganizations,
  onNavigate,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(18rem,88vw)]" showClose>
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
          <Logo size="sm" />
        </div>
        <SheetTitle className="sr-only">Main navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate between dashboard, tasks, projects, people, and settings.
        </SheetDescription>

        <SidebarNav
          organizations={organizations}
          activeOrganization={activeOrganization}
          onSelectOrganization={onSelectOrganization}
          onCreateOrganization={onCreateOrganization}
          isLoadingOrganizations={isLoadingOrganizations}
          onNavigate={onNavigate}
          organizationSwitcher={OrganizationSwitcher}
        />
      </SheetContent>
    </Sheet>
  )
}
