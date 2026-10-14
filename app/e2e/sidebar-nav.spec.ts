import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const EMAIL = process.env.AUDIT_E2E_EMAIL
const PASSWORD = process.env.AUDIT_E2E_PASSWORD

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').waitFor({ state: 'visible' })
  await page.getByLabel('E-mail').fill(EMAIL!)
  await page.getByPlaceholder('Password').fill(PASSWORD!)
  await page.getByRole('button', { name: /Log in|Sign in/i }).click()
  // Login sukses ditandai munculnya navigasi utama admin (bukan URL, karena
  // middleware melakukan redirect bounce singkat via /auth/login).
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 60_000 })
}

// Sidebar is the source of truth for active routes: 5 flat core items.
const CORE_ROUTES = [
  { label: 'Overview', url: '/admin/dashboard' },
  { label: 'Social Accounts', url: '/admin/social-accounts' },
  { label: 'AI Studio', url: '/admin/ai' },
  { label: 'Campaigns', url: '/admin/campaigns' },
  { label: 'Content Calendar', url: '/admin/calendar' },
  { label: 'Analytics', url: '/admin/analytics' },
  { label: 'Marketing ERP', url: '/admin/erp' },
]

test('sidebar: every core route is reachable after login', async ({ page }) => {
  await login(page)

  for (const route of CORE_ROUTES) {
    // Sidebar links carry ?clientId=… so match by prefix, not exact href.
    const link = page.locator(`nav[aria-label="Main Navigation"] a[href^="${route.url}"]`).first()
    await expect(link).toBeVisible({ timeout: 15000 })
    await link.click()
    await page.waitForURL(new RegExp(`${route.url.replace(/\//g, '\\/')}`), { timeout: 15000 })
    // Halaman admin tidak selalu memakai <h1>; pastikan main content ter-render.
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 })
  }
})
