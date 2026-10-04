import { test, expect } from '@playwright/test'

test.setTimeout(120_000)

const EMAIL = process.env.AUDIT_E2E_EMAIL
const PASSWORD = process.env.AUDIT_E2E_PASSWORD

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL!)
  await page.getByLabel('Password').fill(PASSWORD!)
  await page.getByRole('button', { name: /Masuk|Sign in|Log in/i }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

// Sidebar is the source of truth for active routes: 5 flat core items.
const CORE_ROUTES = [
  { label: 'Overview', url: '/admin/dashboard' },
  { label: 'Social Accounts', url: '/admin/social-accounts' },
  { label: 'Campaigns', url: '/admin/campaigns' },
  { label: 'Content Calendar', url: '/admin/calendar' },
  { label: 'Analytics', url: '/admin/analytics' },
  { label: 'Marketing ERP', url: '/admin/erp' },
]

test('sidebar: every core route is reachable after login', async ({ page }) => {
  await login(page)

  for (const route of CORE_ROUTES) {
    const link = page.locator(`aside a[href="${route.url}"]`).first()
    await expect(link).toBeVisible({ timeout: 15000 })
    await link.click()
    await page.waitForURL(new RegExp(`${route.url}$`), { timeout: 15000 })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  }
})
