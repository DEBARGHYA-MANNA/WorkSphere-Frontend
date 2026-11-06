import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { QueryProvider } from '@/app/providers/query-provider'
import { routes } from '@/app/router'
import { ApiError, ApiErrorCode } from '@/lib/api-error'
import { useUiStore } from '@/stores/ui-store'
import { ROUTES } from '@/lib/constants'
import { signInForTest } from '../../../tests/auth-helpers'

/**
 * These tests drive the real pages through the real router, with only the two
 * network service modules stubbed. That exercises the hooks, the query cache,
 * the tenant switching side effects, and the error mapping end to end.
 */

const orgService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  switch: vi.fn(),
  remove: vi.fn(),
}

const invService = {
  list: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  accept: vi.fn(),
}

vi.mock('@/services/organization-service', async (importOriginal) => {
  const actual = await importOriginal()
  const api = {
    ...actual.organizationService,
    list: (...args) => orgService.list(...args),
    get: (...args) => orgService.get(...args),
    create: (...args) => orgService.create(...args),
    update: (...args) => orgService.update(...args),
    switch: (...args) => orgService.switch(...args),
    remove: (...args) => orgService.remove(...args),
  }
  return { ...actual, organizationService: api, default: api }
})

vi.mock('@/services/invitation-service', async (importOriginal) => {
  const actual = await importOriginal()
  const api = {
    ...actual.invitationService,
    list: (...args) => invService.list(...args),
    create: (...args) => invService.create(...args),
    revoke: (...args) => invService.revoke(...args),
    accept: (...args) => invService.accept(...args),
  }
  return { ...actual, invitationService: api, default: api }
})

const ACME = { id: 'org-acme', name: 'Acme Studio', role: 'Owner', description: 'Design work' }
const GLOBEX = { id: 'org-globex', name: 'Globex', role: 'Owner', description: '' }

/**
 * @param {string} path route to mount
 * @param {{ retry?: boolean }} [options] `retry: false` keeps failure tests fast —
 *   the app's default policy retries 5xx twice with backoff, which is correct in
 *   production but slow in a unit test.
 */
function renderAt(path, { retry = true } = {}) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: { v7_partialHydration: true, v7_relativeSplatPath: true },
  })
  const client = retry
    ? undefined
    : new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryProvider client={client}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ activeOrganizationId: null, sidebarCollapsed: false, mobileNavOpen: false })
  signInForTest()
  orgService.list.mockResolvedValue({ items: [ACME], pagination: {} })
  orgService.switch.mockResolvedValue({ organization: ACME, membership: { role: 'Owner' } })
  orgService.remove.mockResolvedValue({})
  invService.list.mockResolvedValue({ items: [], pagination: {} })
})

describe('organizations page', () => {
  it('lists memberships and marks the current one', async () => {
    orgService.list.mockResolvedValue({ items: [ACME, GLOBEX], pagination: {} })
    renderAt(ROUTES.organizations)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Organizations' }),
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    const items = await within(main).findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Acme Studio')).toBeInTheDocument()
    expect(within(items[0]).getByText('Current')).toBeInTheDocument()
    expect(within(items[1]).queryByText('Current')).not.toBeInTheDocument()
  })

  it('shows an empty state with a create action', async () => {
    orgService.list.mockResolvedValue({ items: [], pagination: {} })
    renderAt(ROUTES.organizations)

    expect(await screen.findByText('No organizations yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create organization/ })).toBeInTheDocument()
  })

  it('surfaces a load failure with a retry that refetches', async () => {
    const user = userEvent.setup()
    orgService.list.mockRejectedValueOnce(
      new ApiError({ message: 'Server exploded', status: 500, code: ApiErrorCode.SERVER }),
    )
    renderAt(ROUTES.organizations, { retry: false })

    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded')

    orgService.list.mockResolvedValue({ items: [ACME], pagination: {} })
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    // The sidebar switcher also shows the name, so scope to the page itself.
    expect(await within(screen.getByRole('main')).findByText('Acme Studio')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('switches to another organization', async () => {
    const user = userEvent.setup()
    orgService.list.mockResolvedValue({ items: [ACME, GLOBEX], pagination: {} })
    renderAt(ROUTES.organizations)

    await user.click(await screen.findByRole('button', { name: 'Switch to this organization' }))

    await waitFor(() => expect(orgService.switch).toHaveBeenCalledWith('org-globex'))
    await waitFor(() => expect(useUiStore.getState().activeOrganizationId).toBe('org-globex'))
  })

  it('maps a 409 on create to the name field instead of a banner', async () => {
    const user = userEvent.setup()
    orgService.create.mockRejectedValue(
      new ApiError({
        message: 'Slug taken',
        status: 409,
        code: ApiErrorCode.CONFLICT,
        serverCode: 'ORGANIZATION_SLUG_TAKEN',
      }),
    )
    renderAt(ROUTES.organizations)

    await user.click(await screen.findByRole('button', { name: /New organization/ }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Name/), 'Acme Studio')
    await user.click(within(dialog).getByRole('button', { name: 'Create organization' }))

    expect(await within(dialog).findByText(/already uses this name/)).toBeInTheDocument()
    expect(orgService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Studio' }))
  })
})

describe('organization settings page', () => {
  it('renders the details form and the pending invitation list', async () => {
    invService.list.mockResolvedValue({
      items: [
        {
          id: 'inv-1',
          email: 'newbie@example.com',
          role: 'Member',
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
        },
      ],
      pagination: {},
    })
    renderAt(ROUTES.organizationSettings)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acme Studio' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('newbie@example.com')).toBeInTheDocument()
    expect(invService.list).toHaveBeenCalledWith('org-acme', expect.anything())
    // Owner can delete, so the danger zone is present.
    expect(screen.getByRole('button', { name: 'Delete this organization' })).toBeInTheDocument()
  })

  it('hides the danger zone and invite controls from a Viewer-role member', async () => {
    orgService.list.mockResolvedValue({ items: [{ ...ACME, role: 'Viewer' }], pagination: {} })
    renderAt(ROUTES.organizationSettings)

    await screen.findByRole('heading', { level: 1, name: 'Acme Studio' })
    expect(
      screen.queryByRole('button', { name: 'Delete this organization' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument()
    expect(await screen.findByText('No pending invitations')).toBeInTheDocument()
  })

  it('requires confirmation before revoking an invitation', async () => {
    const user = userEvent.setup()
    invService.list.mockResolvedValue({
      items: [
        {
          id: 'inv-1',
          email: 'newbie@example.com',
          role: 'Member',
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
      ],
      pagination: {},
    })
    invService.revoke.mockResolvedValue({})
    renderAt(ROUTES.organizationSettings)

    await user.click(
      await screen.findByRole('button', { name: 'Revoke invitation for newbie@example.com' }),
    )
    expect(invService.revoke).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Revoke invitation' }))

    await waitFor(() => expect(invService.revoke).toHaveBeenCalledWith('org-acme', 'inv-1'))
  })

  it('maps invitation conflicts from the invite dialog onto the email field', async () => {
    const user = userEvent.setup()
    invService.create.mockRejectedValue(
      new ApiError({
        message: 'Already a member',
        status: 409,
        code: ApiErrorCode.CONFLICT,
        serverCode: 'ALREADY_A_MEMBER',
      }),
    )
    renderAt(ROUTES.organizationSettings)

    await user.click(await screen.findByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Email/), 'ada@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Create invitation' }))

    expect(
      await within(dialog).findByText(/already a member of the organization/),
    ).toBeInTheDocument()
  })

  it('explains that invitations are disabled rather than blaming the user', async () => {
    const user = userEvent.setup()
    invService.create.mockRejectedValue(
      new ApiError({
        message: 'Disabled',
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
        serverCode: 'INVITATIONS_DISABLED',
      }),
    )
    renderAt(ROUTES.organizationSettings)

    await user.click(await screen.findByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Email/), 'ada@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Create invitation' }))

    expect(await within(dialog).findByText(/disabled by this organization/)).toBeInTheDocument()
  })

  it('never promises that an invitation email was delivered', async () => {
    const user = userEvent.setup()
    invService.create.mockResolvedValue({
      invitation: { id: 'inv-2', email: 'ada@example.com', role: 'Member' },
    })
    renderAt(ROUTES.organizationSettings)

    await user.click(await screen.findByRole('button', { name: 'Invite' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/never returned by the API/)).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText(/Email/), 'ada@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Create invitation' }))

    expect(
      await within(dialog).findByText(/Invitation created for ada@example.com/),
    ).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent(/email (was )?sent/i)
    expect(within(dialog).queryByRole('button', { name: /copy/i })).not.toBeInTheDocument()
  })
})

describe('accept invitation page', () => {
  it('accepts the token from the query string and activates the organization', async () => {
    const user = userEvent.setup()
    const token = 'a'.repeat(32)
    invService.accept.mockResolvedValue({
      organization: { id: 'org-new', name: 'Initech' },
      membership: {},
    })
    renderAt(`${ROUTES.acceptInvitation}?token=${token}`)

    const field = await screen.findByLabelText(/Invitation token/)
    expect(field).toHaveValue(token)

    await user.click(screen.getByRole('button', { name: 'Accept invitation' }))

    await waitFor(() => expect(invService.accept).toHaveBeenCalledWith({ token }))
    await waitFor(() => expect(useUiStore.getState().activeOrganizationId).toBe('org-new'))
    // Landing on the dashboard proves the navigation succeeded.
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('validates the token shape before calling the API', async () => {
    const user = userEvent.setup()
    renderAt(ROUTES.acceptInvitation)

    expect(await screen.findByText(/No invitation token was found/)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Invitation token/), 'too-short')
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }))

    expect(await screen.findByText(/looks incomplete/)).toBeInTheDocument()
    expect(invService.accept).not.toHaveBeenCalled()
  })

  it('explains an invalid or expired invitation', async () => {
    const user = userEvent.setup()
    invService.accept.mockRejectedValue(
      new ApiError({
        message: 'Invalid invitation',
        status: 400,
        code: ApiErrorCode.VALIDATION,
        serverCode: 'INVALID_INVITATION',
      }),
    )
    renderAt(`${ROUTES.acceptInvitation}?token=${'b'.repeat(32)}`)

    await user.click(await screen.findByRole('button', { name: 'Accept invitation' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid invitation|invitation/i)
    expect(
      await screen.findByText(/only valid for the email address it was sent to/),
    ).toBeInTheDocument()
  })

  it('tells the user when they are already a member', async () => {
    const user = userEvent.setup()
    invService.accept.mockRejectedValue(
      new ApiError({
        message: 'Already a member',
        status: 409,
        code: ApiErrorCode.CONFLICT,
        serverCode: 'ALREADY_A_MEMBER',
      }),
    )
    renderAt(`${ROUTES.acceptInvitation}?token=${'c'.repeat(32)}`)

    await user.click(await screen.findByRole('button', { name: 'Accept invitation' }))

    expect(await screen.findByText(/already a member of this organization/)).toBeInTheDocument()
  })

  it('requires a verified email, as the backend does', async () => {
    const user = userEvent.setup()
    invService.accept.mockRejectedValue(
      new ApiError({
        message: 'Verify your email first',
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
        serverCode: 'EMAIL_VERIFICATION_REQUIRED',
      }),
    )
    renderAt(`${ROUTES.acceptInvitation}?token=${'d'.repeat(32)}`)

    await user.click(await screen.findByRole('button', { name: 'Accept invitation' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Verify your email first/)
    expect(useUiStore.getState().activeOrganizationId).toBeNull()
  })

  it('redirects to sign-in with a return path when signed out', async () => {
    const { signOutForTest } = await import('../../../tests/auth-helpers')
    signOutForTest()
    renderAt(`${ROUTES.acceptInvitation}?token=${'e'.repeat(32)}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(invService.accept).not.toHaveBeenCalled()
  })
})
