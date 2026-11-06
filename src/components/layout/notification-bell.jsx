import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Notification entry point.
 *
 * The unread badge is driven by the notifications feature (Phase 10). Until that
 * query exists the count is `0` — never a fabricated number — and the link still
 * navigates to the notification center.
 */
export function NotificationBell({ unreadCount = 0 }) {
  const hasUnread = unreadCount > 0
  const label = hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications, none unread'

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label={label}>
      <Link to={ROUTES.notifications}>
        <Bell aria-hidden="true" />
        {hasUnread ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute right-1.5 top-1.5 flex min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold leading-4 text-destructive-foreground',
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
