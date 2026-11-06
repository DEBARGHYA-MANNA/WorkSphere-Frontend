import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for WorkSphere end-to-end tests.
 *
 * E2E specs run against a locally started dev server and a mocked or isolated
 * backend — never production. Set `PLAYWRIGHT_BASE_URL` to point at an already
 * running instance.
 */
const PORT = Number(process.env.PORT) || 5173
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Fail the build on accidental `console.error` / page errors instead of
    // letting broken UI pass silently.
    testIdAttribute: 'data-testid',
  },

  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
