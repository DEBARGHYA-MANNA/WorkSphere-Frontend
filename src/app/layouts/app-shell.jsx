import { Suspense, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PageSkeleton } from '@/components/common/page-skeleton'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useOrganizations } from '@/features/organizations/hooks/use-organizations'
import { useUiStore } from '@/stores/ui-store'

/**
 * Authenticated application shell.
 *
 * Layout contract
 *  ┌───────────────────────────────────────────────┐
 *  │ sidebar (lg+) │ header (sticky)                │
 *  │               ├────────────────────────────────┤
 *  │               │ <main> routed page content     │
 *  └───────────────────────────────────────────────┘
 *
 * Behaviour
 *  - Desktop sidebar collapses to an icon rail; the preference persists.
 *  - Below `lg`, the sidebar becomes a full-height drawer with 44px touch rows.
 *  - Navigating closes the mobile drawer and resets scroll on the main region.
 *  - Focus moves to the main landmark after route changes for keyboard/SR users.
 */
export function AppShell() {
  const location = useLocation()
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen)

  const {
    organizations,
    activeOrganization,
    selectOrganization,
    isLoading: isLoadingOrganizations,
  } = useOrganizations()

  const mainRef = useRef(null)
  // Tracks the pathname we last handled. Focus is only moved when this differs,
  // so the initial page load never steals focus from the browser.
  const previousPathRef = useRef(location.pathname)

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [setMobileNavOpen])
  const openMobileNav = useCallback(() => setMobileNavOpen(true), [setMobileNavOpen])

  // Route change: close the drawer, reset scroll, and hand focus to <main> so
  // screen-reader users hear the new page instead of staying on the old link.
  // `tabIndex={-1}` keeps <main> out of the normal tab order.
  useEffect(() => {
    const pathChanged = previousPathRef.current !== location.pathname
    previousPathRef.current = location.pathname

    setMobileNavOpen(false)

    if (!pathChanged) return

    mainRef.current?.scrollTo?.({ top: 0 })
    mainRef.current?.focus?.({ preventScroll: true })
  }, [location.pathname, setMobileNavOpen])

  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
      <div className="flex min-h-dvh bg-background">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
          organizations={organizations}
          activeOrganization={activeOrganization}
          onSelectOrganization={selectOrganization}
          onCreateOrganization={closeMobileNav}
          isLoadingOrganizations={isLoadingOrganizations}
          onNavigate={undefined}
        />

        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          organizations={organizations}
          activeOrganization={activeOrganization}
          onSelectOrganization={selectOrganization}
          onCreateOrganization={closeMobileNav}
          isLoadingOrganizations={isLoadingOrganizations}
          onNavigate={closeMobileNav}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onOpenMobileNav={openMobileNav} />

          <main
            id="main-content"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 focus-visible:outline-none"
          >
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <div className="page-container">
                  <Outlet />
                </div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
