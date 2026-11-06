import { expect, test } from '@playwright/test'

/**
 * Phase 2 coverage: the dashboard shell — sidebar, header, breadcrumbs, theme,
 * and responsive navigation. Feature workflows arrive in later phases.
 */
test.describe('application shell', () => {
  test('redirects the root path to the dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  })

  test('exposes one main landmark, one banner, and a skip link', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCount(1)
  })

  test('skip link moves focus to the main region', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'Skip to main content' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('navigates between primary destinations', async ({ page }) => {
    await page.goto('/dashboard')

    for (const [label, path] of [
      ['Projects', '/projects'],
      ['My Tasks', '/my-tasks'],
      ['Team Members', '/members'],
      ['Notifications', '/notifications'],
      ['Settings', '/settings'],
    ]) {
      await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('link', { name: label })
        .click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('heading', { level: 1, name: label })).toBeVisible()
    }
  })

  test('marks the active navigation item', async ({ page }) => {
    await page.goto('/projects')
    await expect(
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('collapses the sidebar and remembers it after reload', async ({ page }) => {
    await page.goto('/dashboard')
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })
    await expect(sidebar).not.toHaveAttribute('data-collapsed', 'true')

    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true')

    await page.reload()
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveAttribute(
      'data-collapsed',
      'true',
    )
  })

  test('switches to dark theme and persists the choice', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /theme/i }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('shows an honest empty organization state', async ({ page }) => {
    await page.goto('/dashboard')
    const switcher = page.getByRole('button', { name: 'Select organization' })
    await expect(switcher).toContainText('No organization')

    await switcher.click()
    await expect(page.getByText('You are not a member of any organization yet.')).toBeVisible()
  })

  test('states that global search is unavailable instead of faking it', async ({ page }) => {
    await page.goto('/dashboard')
    const search = page.getByRole('button', { name: /search, unavailable/i })
    await expect(search).toHaveAttribute('aria-disabled', 'true')
  })

  test('renders the not-found page for an unknown route', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })

  test('has a stable, descriptive document title', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveTitle(/WorkSphere/)
  })
})

test.describe('responsive navigation', () => {
  test('opens the drawer on a mobile viewport and closes on navigate', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')

    // The desktop rail is hidden below lg.
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeHidden()

    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()

    await drawer.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('shows the desktop rail and hides the drawer trigger on wide viewports', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')

    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeHidden()
  })

  test('has no horizontal overflow at a mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
