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
 * Sign-out is wired to the session layer (Phase 3): it revokes the refresh cookie
 * server-side, clears the in-memory access token, drops all cached server data,
 * and notifies sibling tabs.
 */
export function ProfileMenu({ user, onSignOut, canSignOut = true, isSigningOut = false }) {
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
          disabled={!canSignOut || isSigningOut}
          onSelect={() => {
            if (canSignOut && !isSigningOut) onSignOut?.()
          }}
        >
          <LogOut aria-hidden="true" />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
