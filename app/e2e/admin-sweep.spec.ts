import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3004', storageState: 'e2e/.auth/admin.json' })

// Every admin route. Sweep them all and record: HTTP status, whether an error
// boundary rendered, and any console/page errors.
const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/analytics/benchmark',
  '/admin/audit',
  '/admin/automations',
  '/admin/calendar',
  '/admin/clients',
  '/admin/crm',
  '/admin/deliverables',
  '/admin/deliverables/new',
  '/admin/global-pipeline',
  '/admin/planning/new',
  '/admin/production',
  '/admin/settings',
  '/admin/settings/ai',
  '/admin/settings/audit',
  '/admin/settings/bridge',
  '/admin/settings/telegram',
  '/admin/settings/users',
  '/admin/skills',
  '/admin/users',
]

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Terjadi kesalahan',
  'Internal Server Error',
  'Unhandled Runtime Error',
  'This page could not be found',
]

test.describe('Admin page sweep', () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route} loads clean`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
      page.on('pageerror', (e) => pageErrors.push(e.message))

      const resp = await page.goto(route, { waitUntil: 'networkidle', timeout: 45000 })
      const status = resp?.status() ?? 0

      // Must not 5xx and must not land on the login page
      expect(status, `HTTP status for ${route}`).toBeLessThan(500)
      expect(page.url(), `${route} should not bounce to login`).not.toMatch(/\/auth\/login/)

      const body = (await page.locator('body').innerText().catch(() => '')) || ''
      for (const marker of ERROR_MARKERS) {
        expect(body, `${route} shows "${marker}"`).not.toContain(marker)
      }

      // Report what we saw (visible in the list reporter)
      if (consoleErrors.length) console.log(`[${route}] console errors:\n  ${consoleErrors.join('\n  ')}`)
      if (pageErrors.length) console.log(`[${route}] page errors:\n  ${pageErrors.join('\n  ')}`)
    })
  }
})
