import { test, expect } from '@playwright/test'

// NOTE (fact): this app has no /client/* routes and no /admin/clients/[id],
// /admin/crm/[id], /admin/deliverables/[id], /admin/skills/[id] routes. They
// were removed in commit 3e36ff3. Multi-client navigation uses the
// `?clientId=` query param on shared /admin/* routes. This spec only covers
// routes that exist (a page.tsx is present).

test.use({ baseURL: 'http://localhost:3000' })

const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL ?? 'test-user@frhm.dev'
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD ?? 'TestPass123!'

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Terjadi kesalahan',
  'Internal Server Error',
  'Unhandled Runtime Error',
  'This page could not be found',
  'Halaman tidak ditemukan',
]

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.context().clearCookies()
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  const emailBox = page.getByPlaceholder('E-mail').first()
  await emailBox.waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(1500)
  await emailBox.click()
  await emailBox.fill(ADMIN_EMAIL)
  const passBox = page.getByPlaceholder('Password').first()
  await passBox.click()
  await passBox.fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /^log in$/i }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30000 })
}

async function assertNoErrorMarkers(page: import('@playwright/test').Page, route: string) {
  expect(page.url(), `${route} bounced to login`).not.toMatch(/\/auth\/login/)
  const body = (await page.locator('body').innerText().catch(() => '')) || ''
  for (const marker of ERROR_MARKERS) {
    expect(body, `${route} shows "${marker}"`).not.toContain(marker)
  }
}

// Resolve a client id from the rendered app (same pattern as full-sweep).
async function resolveClientId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded', timeout: 45000 })
  const el = page.locator('[data-client-id]').first()
  await el.waitFor({ state: 'attached', timeout: 30000 })
  const id = await el.getAttribute('data-client-id')
  if (!id) throw new Error('No client id found on /admin/clients')
  return id
}

test.describe('Admin client-scoped routes (?clientId=)', () => {
  test('/admin/clients lists workspaces', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/clients', { waitUntil: 'domcontentloaded' })
    await assertNoErrorMarkers(page, '/admin/clients')
    await expect(page.getByText(/Add New Client/i).first()).toBeVisible({ timeout: 20000 })
  })

  test('clientId resolves and scopes dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    const clientId = await resolveClientId(page)
    expect(clientId).toMatch(/^[0-9a-f-]{36}$/)
    await page.goto(`/admin/dashboard?clientId=${clientId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await assertNoErrorMarkers(page, '/admin/dashboard?clientId')
    await expect(page.locator('.workspace-switcher-container')).toBeVisible({ timeout: 30000 })
  })

  test('unknown clientId falls back without erroring', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/dashboard?clientId=00000000-0000-0000-0000-000000000000', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })
    await assertNoErrorMarkers(page, '/admin/dashboard (invalid clientId)')
  })
})
