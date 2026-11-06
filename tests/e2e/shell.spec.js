import { expect, test } from '@playwright/test'

/**
 * Phase 1 smoke coverage: the shell boots, routes resolve, and the document
 * carries correct landmarks. Deeper workflow specs arrive in later phases.
 */
test.describe('application shell', () => {
  test('redirects the root path to the dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  })

  test('exposes a skip link and a main landmark', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
  })

  test('renders the not-found page for an unknown route', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })

  test('keeps the document title stable on navigation', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveTitle(/WorkSphere/)
  })
})
