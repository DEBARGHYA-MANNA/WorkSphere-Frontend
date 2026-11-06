import { expect, test } from '@playwright/test'

/**
 * Authentication end-to-end coverage.
 *
 * The API is intercepted with `page.route`, so these specs are deterministic and
 * never touch a real backend or production. Payloads mirror the documented
 * contract (`POST /api/v1/auth/*`).
 */

const USER = {
  _id: '65f1c0ffee000000000000aa',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  avatarUrl: null,
  timezone: 'UTC',
  status: 'active',
}

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
})

/** No resumable session by default: the refresh cookie is absent. */
async function mockSignedOut(page) {
  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill(
      json(
        { success: false, message: 'Authentication required', error: { code: 'UNAUTHENTICATED' } },
        401,
      ),
    ),
  )
}

async function mockLoginSuccess(page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill(
      json({
        success: true,
        data: {
          accessToken: 'e2e-access',
          tokenType: 'Bearer',
          accessTokenExpiresIn: 900,
          user: USER,
        },
      }),
    ),
  )
  await page.route('**/api/v1/users/me', (route) =>
    route.fulfill(json({ success: true, data: { user: USER } })),
  )
}

test.beforeEach(async ({ page }) => {
  await mockSignedOut(page)
})

test.describe('authentication', () => {
  test('shows the login form for a signed-out visitor', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password/i)).toBeVisible()
  })

  test('validates an empty form without hitting the API', async ({ page }) => {
    let loginCalls = 0
    await page.route('**/api/v1/auth/login', (route) => {
      loginCalls += 1
      return route.fulfill(json({}, 500))
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
    expect(loginCalls).toBe(0)
  })

  test('signs in and reaches the dashboard', async ({ page }) => {
    await mockLoginSuccess(page)

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible()
  })

  test('returns the user to the page they originally requested', async ({ page }) => {
    await mockLoginSuccess(page)

    await page.goto('/projects')
    // Redirected to login, remembering the destination.
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprojects/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
  })

  test('refuses an external redirect target', async ({ page }) => {
    await mockLoginSuccess(page)

    await page.goto('/login?redirect=https%3A%2F%2Fevil.example')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Stays inside the app.
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('shows the server message for invalid credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill(
        json(
          {
            success: false,
            message: 'Invalid email or password',
            error: { code: 'INVALID_CREDENTIALS' },
          },
          401,
        ),
      ),
    )

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('wrong password here')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  })

  test('toggles password visibility', async ({ page }) => {
    await page.goto('/login')
    const password = page.getByLabel(/^password/i)
    await expect(password).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(password).toHaveAttribute('type', 'text')
  })

  test('registers without blocking on email verification', async ({ page }) => {
    await page.route('**/api/v1/auth/register', (route) =>
      route.fulfill(
        json(
          {
            success: true,
            data: { user: USER, emailVerificationRequired: false },
          },
          201,
        ),
      ),
    )

    await page.goto('/register')
    await page.getByLabel(/full name/i).fill('Ada Lovelace')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByLabel(/confirm password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Create account' }).click()

    // Verification is disabled on the backend, so sign-in is the next step.
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  })

  test('keeps the access token out of browser storage', async ({ page }) => {
    await mockLoginSuccess(page)
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

    const stored = await page.evaluate(() => ({
      local: JSON.stringify(localStorage),
      session: JSON.stringify(sessionStorage),
      // The refresh token must not be readable by JavaScript at all.
      cookies: document.cookie,
    }))

    expect(stored.local).not.toContain('e2e-access')
    expect(stored.session).not.toContain('e2e-access')
    expect(stored.cookies).not.toContain('worksphereRefreshToken')
  })

  test('signs out and returns to login', async ({ page }) => {
    await mockLoginSuccess(page)
    await page.route('**/api/v1/auth/logout', (route) =>
      route.fulfill(json({ success: true, data: null })),
    )

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/^password/i).fill('correct horse battery')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

    await page.getByRole('button', { name: /account menu/i }).click()
    await page.getByRole('menuitem', { name: 'Sign out' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  })

  test('keeps a signed-in user away from the login screen', async ({ page }) => {
    await mockLoginSuccess(page)
    // Simulate a resumable session: refresh succeeds.
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill(
        json({ success: true, data: { accessToken: 'e2e-access', accessTokenExpiresIn: 900 } }),
      ),
    )

    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  })

  test('restores a session from the refresh cookie on reload', async ({ page }) => {
    await mockLoginSuccess(page)
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill(
        json({ success: true, data: { accessToken: 'e2e-access', accessTokenExpiresIn: 900 } }),
      ),
    )

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    // The profile is loaded through the restored token.
    await expect(page.getByRole('button', { name: /account menu/i })).toBeVisible()
  })

  test('forgot password never reveals whether an account exists', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill(json({ success: true, data: null })),
    )

    await page.goto('/forgot-password')
    await page.getByLabel(/email/i).fill('nobody@example.com')
    await page.getByRole('button', { name: /send reset instructions/i }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Check your email' })).toBeVisible()
    await expect(page.getByText(/if an account exists for that address/i)).toBeVisible()
  })

  test('prefills the reset token from the email link', async ({ page }) => {
    const token = 'a'.repeat(40)
    await page.goto(`/reset-password?token=${token}`)
    await expect(page.getByLabel(/reset token/i)).toHaveValue(token)
  })

  test('is usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')

    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
