import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from '@/app/router'
import { QueryProvider } from '@/app/providers/query-provider'
import { signInForTest, signOutForTest } from '../../../tests/auth-helpers'

beforeEach(() => {
  signInForTest()
})

function renderRoute(path) {
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

describe('router', () => {
  it('redirects / to the dashboard', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders the shell landmarks on a protected route', async () => {
    renderRoute('/projects')
    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getAllByRole('complementary').length).toBeGreaterThan(0)
  })

  it.each([
    ['/my-tasks', 'My Tasks'],
    ['/members', 'Team Members'],
    ['/notifications', 'Notifications'],
    ['/settings', 'Settings'],
  ])('renders %s with its heading', async (path, heading) => {
    renderRoute(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('redirects to login with a safe return path when signed out', async () => {
    signOutForTest()
    renderRoute('/projects')

    // The guard replaces the protected route with the login screen.
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders a 404 page for unknown routes', async () => {
    renderRoute('/nope')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
