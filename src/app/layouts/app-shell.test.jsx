import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from '@/app/router'
import { QueryProvider } from '@/app/providers/query-provider'
import { useUiStore } from '@/stores/ui-store'
import { signInForTest } from '../../../tests/auth-helpers'

function renderShell(path = '/dashboard') {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: { v7_partialHydration: true, v7_relativeSplatPath: true },
  })
  return render(
    <QueryProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryProvider>,
  )
}

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, mobileNavOpen: false, theme: 'system' })
  // The shell sits behind ProtectedRoute, so a session must exist.
  signInForTest()
})

describe('AppShell layout', () => {
  it('renders the sidebar, header, and main landmark', async () => {
    renderShell()

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    // Exactly one banner landmark (the app header) — page headers are not banners.
    expect(screen.getAllByRole('banner')).toHaveLength(1)
  })

  it('renders every primary navigation destination', async () => {
    renderShell()

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    const nav = within(sidebar).getByRole('navigation', { name: 'Primary' })

    for (const [label, href] of [
      ['Dashboard', '/dashboard'],
      ['My Tasks', '/my-tasks'],
      ['Projects', '/projects'],
      ['Team Members', '/members'],
      ['Notifications', '/notifications'],
      ['Settings', '/settings'],
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  it('marks the current route with aria-current', async () => {
    renderShell('/projects')

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    expect(within(sidebar).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('keeps the section active on nested routes', async () => {
    renderShell('/settings/profile')

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    expect(within(sidebar).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('collapses and expands the desktop sidebar', async () => {
    const user = userEvent.setup()
    renderShell()

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    expect(sidebar).not.toHaveAttribute('data-collapsed')

    await user.click(within(sidebar).getByRole('button', { name: 'Collapse sidebar' }))

    expect(useUiStore.getState().sidebarCollapsed).toBe(true)
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toHaveAttribute(
      'data-collapsed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(useUiStore.getState().sidebarCollapsed).toBe(false)
  })

  it('opens and closes the mobile navigation drawer', async () => {
    const user = userEvent.setup()
    renderShell()

    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()

    await user.click(within(drawer).getByRole('button', { name: 'Close navigation' }))
    expect(useUiStore.getState().mobileNavOpen).toBe(false)
  })

  it('closes the mobile drawer after navigating', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(await screen.findByRole('button', { name: 'Open navigation menu' }))
    const drawer = await screen.findByRole('dialog')

    await user.click(within(drawer).getByRole('link', { name: 'Projects' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(useUiStore.getState().mobileNavOpen).toBe(false)
  })

  it('offers the skip link as the first focusable element', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
  })

  it('moves focus to main after an in-app navigation', async () => {
    const user = userEvent.setup()
    renderShell()

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' })
    await user.click(within(sidebar).getByRole('link', { name: 'My Tasks' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'My Tasks' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
  })
})

describe('AppShell organization context', () => {
  it('shows an honest empty state when the user has no organizations', async () => {
    renderShell()
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' })
    const switcher = within(sidebar).getByRole('button', { name: 'Select organization' })
    expect(switcher).toHaveTextContent('No organization')
  })

  it('explains the empty organization menu instead of inventing one', async () => {
    const user = userEvent.setup()
    renderShell()
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' })
    await user.click(within(sidebar).getByRole('button', { name: 'Select organization' }))

    expect(
      await screen.findByText('You are not a member of any organization yet.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Create organization' })).toBeInTheDocument()
  })
})
