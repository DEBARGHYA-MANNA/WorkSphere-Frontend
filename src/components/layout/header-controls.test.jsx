import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { ProfileMenu } from '@/components/layout/profile-menu'
import { NotificationBell } from '@/components/layout/notification-bell'
import { OrganizationSwitcher } from '@/components/layout/organization-switcher'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/ui-store'

function renderInProviders(ui) {
  return render(
    <MemoryRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useUiStore.setState({ theme: 'system' })
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('offers light, dark, and system as distinct choices', async () => {
    const user = userEvent.setup()
    renderInProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /theme/i }))

    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: 'Light' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemradio', { name: 'Dark' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemradio', { name: 'System' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('applies the dark theme to the document', async () => {
    const user = userEvent.setup()
    renderInProviders(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /theme/i }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }))

    expect(useUiStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('announces the current theme in its accessible name', () => {
    useUiStore.setState({ theme: 'light' })
    renderInProviders(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /theme: light/i })).toBeInTheDocument()
  })
})

describe('ProfileMenu', () => {
  it('shows the user identity and account destinations', async () => {
    const user = userEvent.setup()
    renderInProviders(
      <ProfileMenu user={{ name: 'Ada Lovelace', email: 'ada@example.com' }} canSignOut={false} />,
    )

    await user.click(screen.getByRole('button', { name: /account menu for ada lovelace/i }))

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/settings/profile',
    )
    expect(screen.getByRole('menuitem', { name: 'Organization settings' })).toHaveAttribute(
      'href',
      '/settings/organization',
    )
  })

  it('signs out through the session layer', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    renderInProviders(<ProfileMenu user={{ name: 'Ada' }} onSignOut={onSignOut} />)

    await user.click(screen.getByRole('button', { name: /account menu/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('disables sign-out while it is already in flight', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    renderInProviders(<ProfileMenu user={{ name: 'Ada' }} onSignOut={onSignOut} isSigningOut />)

    await user.click(screen.getByRole('button', { name: /account menu/i }))
    const item = await screen.findByRole('menuitem', { name: 'Signing out…' })

    expect(item).toHaveAttribute('aria-disabled', 'true')
    expect(onSignOut).not.toHaveBeenCalled()
  })
})

describe('NotificationBell', () => {
  it('has no badge when nothing is unread', () => {
    renderInProviders(<NotificationBell unreadCount={0} />)
    expect(screen.getByRole('link', { name: 'Notifications, none unread' })).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows and announces the unread count', () => {
    renderInProviders(<NotificationBell unreadCount={7} />)
    expect(screen.getByRole('link', { name: 'Notifications, 7 unread' })).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('caps the badge at 99+', () => {
    renderInProviders(<NotificationBell unreadCount={250} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Notifications, 250 unread' })).toBeInTheDocument()
  })
})

describe('OrganizationSwitcher', () => {
  const organizations = [
    { id: '1', name: 'Acme Corp', role: 'Owner' },
    { id: '2', name: 'Globex', role: 'Member' },
  ]

  it('shows a loading state while memberships resolve', () => {
    const { container } = renderInProviders(<OrganizationSwitcher isLoading />)
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.getByText('Loading organizations…')).toBeInTheDocument()
  })

  it('displays the active organization and its role', () => {
    renderInProviders(
      <OrganizationSwitcher
        organizations={organizations}
        activeOrganization={organizations[0]}
        onSelect={vi.fn()}
      />,
    )
    const trigger = screen.getByRole('button', { name: /current organization: acme corp/i })
    expect(trigger).toHaveTextContent('Acme Corp')
    expect(trigger).toHaveTextContent('Owner')
  })

  it('switches organization from the menu', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderInProviders(
      <OrganizationSwitcher
        organizations={organizations}
        activeOrganization={organizations[0]}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole('button', { name: /current organization/i }))
    await user.click(await screen.findByRole('menuitem', { name: /globex/i }))

    expect(onSelect).toHaveBeenCalledWith('2')
  })

  it('marks the current organization for assistive technology', async () => {
    const user = userEvent.setup()
    renderInProviders(
      <OrganizationSwitcher
        organizations={organizations}
        activeOrganization={organizations[0]}
        onSelect={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /current organization/i }))
    expect(
      await screen.findByText('Current organization', { selector: '.sr-only' }),
    ).toBeInTheDocument()
  })

  it('renders an empty state with a create action when there are none', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    renderInProviders(<OrganizationSwitcher organizations={[]} onCreate={onCreate} />)

    expect(screen.getByRole('button', { name: 'Select organization' })).toHaveTextContent(
      'No organization',
    )
    await user.click(screen.getByRole('button', { name: 'Select organization' }))
    expect(
      await screen.findByText('You are not a member of any organization yet.'),
    ).toBeInTheDocument()
  })
})
