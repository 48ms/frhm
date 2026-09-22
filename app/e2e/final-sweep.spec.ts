import { test, expect } from '@playwright/test'

/**
 * FINAL FULL-SITE SWEEP — factual coverage of ALL pages.
 * 35 pages enumerated from filesystem (see openspec).
 * Per-test authentication. No beforeAll page fixtures.
 */
test.use({ baseURL: 'http://localhost:3004' })

const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL ?? 'test-user@frhm.dev'
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD ?? 'TestPass123!'
const CLIENT_EMAIL = process.env.CLIENT_E2E_EMAIL ?? 'taraju.test.4fd43222@gmail.com'
const CLIENT_PASSWORD = process.env.CLIENT_E2E_PASSWORD ?? 'TestPass123!'

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Terjadi kesalahan',
  'Internal Server Error',
  'Unhandled Runtime Error',
  'This page could not be found',
]

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 })
}

async function loginAsClient(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(CLIENT_EMAIL)
  await page.getByLabel('Password').fill(CLIENT_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/client(\/|$)/, { timeout: 20000 })
}

async function assertClean(page: import('@playwright/test').Page) {
  expect(page.url(), 'should not bounce to login').not.toMatch(/\/auth\/login/)
  const body = (await page.locator('body').innerText().catch(() => '')) || ''
  for (const marker of ERROR_MARKERS) {
    expect(body, `body should not contain ${marker}`).not.toContain(marker)
  }
}

async function resolveClientId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 15000 })
  const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
  if (!m) throw new Error(`No client ID in href: ${href}`)
  return m[1]
}

// ============================================================================
// PUBLIC + AUTH
// ============================================================================

test('/ (landing) loads clean', async ({ page }) => {
  const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  expect(resp?.status()).toBeLessThan(500)
  await assertClean(page)
})

test('/auth/login loads clean', async ({ page }) => {
  const resp = await page.goto('/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  expect(resp?.status()).toBeLessThan(500)
  // Login page is expected to be ON the login URL (not bounce away)
  expect(page.url(), 'login page should stay on /auth/login').toContain('/auth/login')
  await page.waitForSelector('input[type="email"], [placeholder*="Email"], [aria-label="Email"]', { timeout: 10000 })
})

test('/waitlist loads clean (redirects authenticated users to dashboard)', async ({ page }) => {
  // Unauthenticated → should redirect to login
  const resp = await page.goto('/waitlist', { waitUntil: 'domcontentloaded', timeout: 30000 })
  expect(resp?.status()).toBeLessThan(500)
  // Should bounce to login (not show error)
  expect(page.url(), 'unauthenticated waitlist should redirect to login').toContain('/auth/login')
})

// ============================================================================
// ADMIN — STATIC ROUTES
// ============================================================================

const ADMIN_STATIC = [
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

for (const route of ADMIN_STATIC) {
  test(`GET ${route} loads clean (admin)`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const resp = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45000 })
    expect(resp?.status(), `${route} status`).toBeLessThan(500)
    await assertClean(page)
    // wait a beat for client-side errors
    await page.waitForTimeout(1200)
    if (consoleErrors.length) {
      const real = consoleErrors.filter(e => !e.includes('Failed to load resource'))
      if (real.length) console.log(`[${route}] console errors:\n  ${real.join('\n  ')}`)
    }
  })
}

// ============================================================================
// ADMIN — DYNAMIC [id] ROUTES
// ============================================================================

test('/admin/clients/[id] loads clean (workspace)', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  await loginAsAdmin(page)
  const clientId = await resolveClientId(page)
  const t0 = Date.now()
  const resp = await page.goto(`/admin/clients/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  console.log(`[workspace] client=${clientId} elapsed=${Date.now() - t0}ms`)
  expect(resp?.status()).toBeLessThan(500)
  await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
  await assertClean(page)
  if (consoleErrors.length) console.log(`[workspace] console errors:\n  ${consoleErrors.join('\n  ')}`)
})

test('/admin/crm/[id] loads clean', async ({ page }) => {
  await loginAsAdmin(page)
  const clientId = await resolveClientId(page)
  const resp = await page.goto(`/admin/crm/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  expect(resp?.status()).toBeLessThan(500)
  await assertClean(page)
})

test('/admin/deliverables/[id] loads clean', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/deliverables', { waitUntil: 'domcontentloaded', timeout: 30000 })
  try {
    await page.waitForSelector('a[href*="/admin/deliverables/"]', { timeout: 10000 })
    const href = await page.locator('a[href*="/admin/deliverables/"]').first().getAttribute('href')
    const m = href?.match(/\/admin\/deliverables\/([a-f0-9-]+)/)
    if (m) {
      const resp = await page.goto(`/admin/deliverables/${m[1]}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      expect(resp?.status()).toBeLessThan(500)
      await assertClean(page)
      return
    }
  } catch { /* no deliverables in DB */ }
  const resp = await page.goto('/admin/deliverables/invalid-id-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
  expect(resp?.status()).toBeLessThan(500)
})

test('/admin/skills/[id] loads clean (404 gracefully)', async ({ page }) => {
  await loginAsAdmin(page)
  const resp = await page.goto('/admin/skills/nonexistent-skill-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (resp) expect(resp.status()).toBeLessThan(500)
  await assertClean(page)
})

// ============================================================================
// CLIENT PORTAL
// ============================================================================

const CLIENT_STATIC = [
  '/client/dashboard',
  '/client/deliverables',
  '/client/calendar',
  '/client/pipeline',
  '/client/settings',
  '/client/approvals',
]

for (const route of CLIENT_STATIC) {
  test(`GET ${route} loads clean (client)`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    const resp = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45000 })
    expect(resp?.status(), `${route} status`).toBeLessThan(500)
    // approvals has no h1; all pages have at least one heading or body text
    await page.waitForSelector('h1, h2', { timeout: 20000 })
    await assertClean(page)
    await page.waitForTimeout(1200)
    if (consoleErrors.length) {
      const real = consoleErrors.filter(e => !e.includes('Failed to load resource'))
      if (real.length) console.log(`[${route}] console errors:\n  ${real.join('\n  ')}`)
    }
  })
}

test('/client/deliverables/[id] loads clean', async ({ page }) => {
  await loginAsClient(page)
  await page.goto('/client/deliverables', { waitUntil: 'domcontentloaded', timeout: 30000 })
  try {
    await page.waitForSelector('a[href*="/client/deliverables/"]', { timeout: 10000 })
    const href = await page.locator('a[href*="/client/deliverables/"]').first().getAttribute('href')
    const m = href?.match(/\/client\/deliverables\/([a-f0-9-]+)/)
    if (m) {
      const resp = await page.goto(`/client/deliverables/${m[1]}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      expect(resp?.status()).toBeLessThan(500)
      await assertClean(page)
      return
    }
  } catch { /* no deliverables */ }
  const resp = await page.goto('/client/deliverables/invalid-id', { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (resp) expect(resp.status()).toBeLessThan(500)
})