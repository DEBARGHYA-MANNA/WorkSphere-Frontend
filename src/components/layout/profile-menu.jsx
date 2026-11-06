import { Link } from 'react-router-dom'
import { LogOut, Settings, UserRound, Building2 } from 'lucide-react'
import { UserAvatar } from '@/components/common/user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/lib/constants'

/**
 * Profile menu in the header.
 *
 * Sign-out is intentionally disabled until Phase 3 authenticates the session:
 * showing a working-looking control that cannot act would be dishonest. The item
 * states why it is unavailable.
 */
export function ProfileMenu({ user, onSignOut, canSignOut = false }) {
  const name = user?.name ?? 'Account'
  const email = user?.email ?? ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Account menu for ${name}`}
        >
          <UserAvatar name={name} email={email} src={user?.avatarUrl} size="sm" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="flex items-center gap-2.5 py-1">
            <UserAvatar name={name} email={email} src={user?.avatarUrl} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              {email ? (
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              ) : null}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={ROUTES.profileSettings}>
            <UserRound aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.organizationSettings}>
            <Building2 aria-hidden="true" />
            Organization settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.appearanceSettings}>
            <Settings aria-hidden="true" />
            Preferences
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={!canSignOut}
          onSelect={() => {
            if (canSignOut) onSignOut?.()
          }}
        >
          <LogOut aria-hidden="true" />
          {canSignOut ? 'Sign out' : 'Sign out (Phase 3)'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
