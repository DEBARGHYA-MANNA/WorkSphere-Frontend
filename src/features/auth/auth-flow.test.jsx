import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { routes } from '@/app/router'
import { QueryProvider } from '@/app/providers/query-provider'
import { SessionProvider } from '@/app/providers/session-provider'
import { AUTH_STATUS, useAuthStore } from '@/features/auth/auth-store'
import { getAccessToken } from '@/services/http/token-store'
import { resetAuthForTest, signInForTest, testUser } from '../../../tests/auth-helpers'

// The network is mocked at the service boundary: these tests assert the UI's
// contract with the session layer, not Axios behaviour (covered separately).
const authService = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}

vi.mock('@/services/auth-service', () => ({
  authService: {
    login: (...args) => authService.login(...args),
    register: (...args) => authService.register(...args),
    logout: (...args) => authService.logout(...args),
    me: (...args) => authService.me(...args),
    forgotPassword: (...args) => authService.forgotPassword(...args),
    resetPassword: (...args) => authService.resetPassword(...args),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

const refreshAccessToken = vi.fn()
vi.mock('@/services/http/interceptors', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    refreshAccessToken: (...args) => refreshAccessToken(...args),
    attachInterceptors: () => () => {},
    attachCrossTabSync: () => () => {},
    isRefreshing: () => false,
  }
})

function renderApp(path = '/login') {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: { v7_partialHydration: true, v7_relativeSplatPath: true },
  })
  return render(
    <QueryProvider>
      {/* SessionProvider runs the real bootstrap; the refresh call is mocked, so
          each test controls whether a resumable session exists. */}
      <SessionProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </SessionProvider>
    </QueryProvider>,
  )
}

/** Fill and submit the login form. */
async function submitLogin(
  user,
  { email = 'ada@example.com', password = 'correct horse battery' } = {},
) {
  await user.type(await screen.findByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/^password/i), password)
  await user.click(screen.getByRole('button', { name: /^sign in$/i }))
}

beforeEach(() => {
  resetAuthForTest()
  refreshAccessToken.mockReset()
  // Default: no resumable session, i.e. a signed-out visitor.
  refreshAccessToken.mockRejectedValue({ isApiError: true, status: 401, message: 'no session' })
  Object.values(authService).forEach((fn) => fn.mockReset())
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('login', () => {
  it('signs in and lands on the dashboard', async () => {
    const user = userEvent.setup()
    authService.login.mockResolvedValue({
      accessToken: 'access-1',
      accessTokenExpiresIn: 900,
      user: testUser,
    })

    renderApp('/login')
    await submitLogin(user)

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.authenticated)
    expect(useAuthStore.getState().user).toEqual(testUser)
  })

  it('keeps the access token in memory only — never in browser storage', async () => {
    const user = userEvent.setup()
    authService.login.mockResolvedValue({
      accessToken: 'secret-access-token',
      accessTokenExpiresIn: 900,
      user: testUser,
    })

    renderApp('/login')
    await submitLogin(user)
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    expect(getAccessToken()).toBe('secret-access-token')

    // Nothing sensitive may be persisted.
    const dump = JSON.stringify({ ...localStorage })
    expect(dump).not.toContain('secret-access-token')
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-access-token')
  })

  it('shows inline validation for an empty form and never calls the API', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(await screen.findByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(await screen.findByText('Password is required')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('marks invalid inputs with aria-invalid and links the error message', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(await screen.findByRole('button', { name: /^sign in$/i }))
    const email = screen.getByLabelText(/email/i)

    expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy.split(' ')[0])).toBeTruthy()
  })

  it('shows the backend message on invalid credentials', async () => {
    const user = userEvent.setup()
    authService.login.mockRejectedValue({
      isApiError: true,
      status: 401,
      message: 'Invalid email or password',
    })

    renderApp('/login')
    await submitLogin(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid email or password')
    expect(useAuthStore.getState().status).not.toBe(AUTH_STATUS.authenticated)
  })

  it('maps backend field errors onto the matching inputs', async () => {
    const user = userEvent.setup()
    authService.login.mockRejectedValue({
      isApiError: true,
      status: 401,
      message: 'Invalid email or password',
      details: { email: 'No account uses this address' },
    })

    renderApp('/login')
    await submitLogin(user)

    expect(await screen.findByText('No account uses this address')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('returns the user to the originally requested page', async () => {
    const user = userEvent.setup()
    authService.login.mockResolvedValue({
      accessToken: 'access-1',
      accessTokenExpiresIn: 900,
      user: testUser,
    })

    renderApp('/login?redirect=%2Fprojects')
    await submitLogin(user)

    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
  })

  it('ignores an unsafe redirect target', async () => {
    const user = userEvent.setup()
    authService.login.mockResolvedValue({
      accessToken: 'access-1',
      accessTokenExpiresIn: 900,
      user: testUser,
    })

    renderApp('/login?redirect=https%3A%2F%2Fevil.example')
    await submitLogin(user)

    // Falls back to the dashboard rather than leaving the app.
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('can toggle password visibility', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    const input = await screen.findByLabelText(/^password/i)
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('registration', () => {
  it('creates an account and sends the user to sign in when verification is disabled', async () => {
    const user = userEvent.setup()
    authService.register.mockResolvedValue({ user: testUser, emailVerificationRequired: false })

    renderApp('/register')
    await user.type(await screen.findByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'correct horse battery',
    })
  })

  it('does not sign the user in automatically after registering', async () => {
    const user = userEvent.setup()
    authService.register.mockResolvedValue({ user: testUser, emailVerificationRequired: false })

    renderApp('/register')
    await user.type(await screen.findByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await screen.findByRole('heading', { level: 1, name: 'Sign in' })
    expect(useAuthStore.getState().status).not.toBe(AUTH_STATUS.authenticated)
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('blocks registration when passwords differ', async () => {
    const user = userEvent.setup()
    renderApp('/register')

    await user.type(await screen.findByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery')
    await user.type(screen.getByLabelText(/confirm password/i), 'something else entirely')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows the verification screen only when the backend says it is required', async () => {
    const user = userEvent.setup()
    authService.register.mockResolvedValue({ user: testUser, emailVerificationRequired: true })

    renderApp('/register')
    await user.type(await screen.findByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Check your email' }),
    ).toBeInTheDocument()
  })

  it('explains a duplicate email on the email field', async () => {
    const user = userEvent.setup()
    authService.register.mockRejectedValue({
      isApiError: true,
      status: 409,
      message: 'Email address is already registered',
    })

    renderApp('/register')
    await user.type(await screen.findByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'correct horse battery')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct horse battery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(/an account with this email already exists/i),
    ).toBeInTheDocument()
  })
})

describe('password recovery', () => {
  it('shows a deliberately generic confirmation', async () => {
    const user = userEvent.setup()
    authService.forgotPassword.mockResolvedValue(null)

    renderApp('/forgot-password')
    await user.type(await screen.findByLabelText(/email/i), 'unknown@example.com')
    await user.click(screen.getByRole('button', { name: /send reset instructions/i }))

    const heading = await screen.findByRole('heading', { level: 1, name: 'Check your email' })
    expect(heading).toBeInTheDocument()
    // Must not confirm whether the account exists.
    expect(screen.getByText(/if an account exists for that address/i)).toBeInTheDocument()
  })

  it('prefills the reset token from the link and submits it', async () => {
    const user = userEvent.setup()
    authService.resetPassword.mockResolvedValue(null)

    const token = 'a'.repeat(40)
    renderApp(`/reset-password?token=${token}`)

    expect(await screen.findByLabelText(/reset token/i)).toHaveValue(token)

    await user.type(screen.getByLabelText(/^new password/i), 'another good passphrase')
    await user.type(screen.getByLabelText(/confirm new password/i), 'another good passphrase')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(authService.resetPassword).toHaveBeenCalledWith({
        token,
        password: 'another good passphrase',
      }),
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
  })

  it('tells the user when the link carried no token', async () => {
    renderApp('/reset-password')
    expect(await screen.findByText(/no reset token was found in the link/i)).toBeInTheDocument()
  })
})

describe('route protection', () => {
  it('sends a signed-out visitor from a protected route to login', async () => {
    renderApp('/projects')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.unauthenticated)
  })

  it('keeps the destination through the login redirect', async () => {
    const user = userEvent.setup()
    authService.login.mockResolvedValue({
      accessToken: 'access-1',
      accessTokenExpiresIn: 900,
      user: testUser,
    })

    renderApp('/projects')
    await submitLogin(user)

    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
  })

  it('shows a restoring-session state instead of redirecting while checking', async () => {
    useAuthStore.setState({ status: AUTH_STATUS.checking })
    renderApp('/dashboard')

    const status = await screen.findByRole('status')
    expect(within(status).getByText(/restoring your session/i)).toBeInTheDocument()
    // No login form flash during bootstrap.
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('keeps a signed-in user out of the login screen', async () => {
    signInForTest()
    renderApp('/login')

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('restores a session from the refresh cookie on a cold start', async () => {
    refreshAccessToken.mockResolvedValue('restored-token')
    authService.me.mockResolvedValue(testUser)

    renderApp('/dashboard')

    // A request to /auth/refresh happens because the token is memory-only.
    await waitFor(() => expect(refreshAccessToken).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(useAuthStore.getState().user).toEqual(testUser)
  })

  it('treats a failed refresh as simply "not signed in"', async () => {
    refreshAccessToken.mockRejectedValue({ isApiError: true, status: 401, message: 'no session' })

    renderApp('/dashboard')

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.unauthenticated)
  })
})

describe('sign out', () => {
  it('clears the session and returns to login', async () => {
    const user = userEvent.setup()
    signInForTest()
    authService.logout.mockResolvedValue(null)

    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    await user.click(screen.getByRole('button', { name: /account menu/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe(AUTH_STATUS.unauthenticated)
    expect(getAccessToken()).toBeNull()
  })

  it('still signs the user out locally when the request fails', async () => {
    const user = userEvent.setup()
    signInForTest()
    authService.logout.mockRejectedValue({ isApiError: true, status: 500, message: 'boom' })

    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' })

    await user.click(screen.getByRole('button', { name: /account menu/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))

    // A user who asks to sign out must never be left signed in.
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })

  it('explains why the session ended', async () => {
    useAuthStore.setState({ status: AUTH_STATUS.unauthenticated, endedReason: 'refresh_failed' })
    renderApp('/login')

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument()
  })
})
