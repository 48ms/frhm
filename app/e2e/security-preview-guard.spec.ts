import { test, expect } from '@playwright/test'

/**
 * app/preview-* routes are unauthenticated UI fixtures used by the Playwright
 * suite and local design review. They must NEVER be reachable in production
 * (see lib/preview-guard.ts → notFound() when NODE_ENV=production).
 *
 * The E2E server runs in development, so here we assert the *dev* contract:
 * the fixtures are reachable, and they are explicitly marked with the guard so
 * a production build 404s. The production 404 itself is covered by the unit
 * test in lib/preview-guard.test.ts (which mocks NODE_ENV=production).
 */
test.describe('Preview route guard', () => {
  test('preview fixtures are reachable in development', async ({ page }) => {
    for (const route of ['/preview-erp', '/preview-calendar', '/preview-settings', '/preview-support']) {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(resp?.status(), `${route} should render in dev`).toBe(200)
      expect(page.url(), `${route} should not bounce to login in dev`).not.toContain('/auth/login')
    }
  })
})
