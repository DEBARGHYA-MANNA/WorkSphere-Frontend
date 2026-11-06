import { Menu, Search } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { NotificationBell } from '@/components/layout/notification-bell'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Application header.
 *
 * Contains the mobile nav trigger, breadcrumbs, and the utility cluster
 * (search, notifications, theme, profile). It sticks to the top of the content
 * column so context is never lost while scrolling.
 *
 * Global search is rendered as a **disabled** affordance with an explanatory
 * tooltip: the backend contract has no cross-resource search endpoint, and the
 * brief forbids simulating one.
 */
export function AppHeader({ onOpenMobileNav }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu aria-hidden="true" />
      </Button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            {/* aria-disabled (not `disabled`) keeps the control focusable so
                keyboard users can reach the tooltip that explains why search is
                unavailable. It performs no action. */}
            <Button
              variant="ghost"
              size="icon"
              aria-disabled="true"
              aria-label="Search, unavailable"
              onClick={(event) => event.preventDefault()}
              className="cursor-not-allowed opacity-60"
            >
              <Search aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56 text-center">
            Global search is not available yet — the API exposes no cross-resource search endpoint.
          </TooltipContent>
        </Tooltip>

        <NotificationBell />
        <ThemeToggle />
        <ProfileMenu canSignOut={false} />
      </div>
    </header>
  )
}
