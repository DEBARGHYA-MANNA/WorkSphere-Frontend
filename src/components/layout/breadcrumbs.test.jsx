import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { buildBreadcrumbs } from '@/lib/breadcrumbs'

function renderAt(path, labels) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumbs labels={labels} />
    </MemoryRouter>,
  )
}

describe('buildBreadcrumbs', () => {
  it('builds a cumulative trail', () => {
    expect(buildBreadcrumbs('/projects/abc/tasks')).toEqual([
      { label: 'Projects', to: '/projects', isCurrent: false },
      { label: 'abc', to: '/projects/abc', isCurrent: false },
      { label: 'Tasks', to: '/projects/abc/tasks', isCurrent: true },
    ])
  })

  it('uses supplied labels for dynamic segments', () => {
    const items = buildBreadcrumbs('/projects/65f1c0ffee00000000000001', {
      '65f1c0ffee00000000000001': 'Apollo',
    })
    expect(items[1]).toEqual({
      label: 'Apollo',
      to: '/projects/65f1c0ffee00000000000001',
      isCurrent: true,
    })
  })

  it('never leaks a raw 24-char object id into the UI', () => {
    const items = buildBreadcrumbs('/projects/65f1c0ffee00000000000001')
    expect(items[1].label).toBe('Details')
  })

  it('humanises unknown static segments', () => {
    expect(buildBreadcrumbs('/release-notes')[0].label).toBe('release notes')
  })

  it('returns nothing for the root path', () => {
    expect(buildBreadcrumbs('/')).toEqual([])
  })
})

describe('Breadcrumbs', () => {
  it('renders nothing when the route has a single segment', () => {
    renderAt('/projects')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })

  it('marks the last crumb as the current page and links the ancestors', async () => {
    renderAt('/projects/65f1c0ffee00000000000001/tasks', {
      '65f1c0ffee00000000000001': 'Apollo',
    })

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()

    const current = screen.getByText('Tasks')
    expect(current).toHaveAttribute('aria-current', 'page')
    // The current page is not a link to itself.
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: 'Apollo' })).toHaveAttribute(
      'href',
      '/projects/65f1c0ffee00000000000001',
    )
  })

  it('is keyboard reachable', async () => {
    const user = userEvent.setup()
    renderAt('/projects/65f1c0ffee00000000000001')

    await user.tab()
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveFocus()
  })
})
