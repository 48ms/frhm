import { test, expect } from '@playwright/test'

// Coverage gap test: dynamic admin [id] routes + all client portal pages.
// Previous sweep (admin-sweep.spec.ts) only covered 21 STATIC admin routes.
//
// Uses env vars (set before run):
//   ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_EMAIL, CLIENT_PASSWORD

test.use({ baseURL: 'http://localhost:3004' })

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'test-user@frhm.dev'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestPass123!'
const CLIENT_EMAIL = process.env.CLIENT_EMAIL ?? 'taraju.test.4fd43222@gmail.com'
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD ?? 'TestPass123!'

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Terjadi kesalahan',
  'Internal Server Error',
  'Unhandled Runtime Error',
  'This page could not be found',
]

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 })
}

async function loginAsClient(page: import('@playwright/test').Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Email').fill(CLIENT_EMAIL)
  await page.getByLabel('Password').fill(CLIENT_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/client(\/|$)/, { timeout: 20000 })
}

async function assertNoErrorMarkers(page: import('@playwright/test').Page, route: string) {
  const body = await page.locator('body').innerText().catch(() => '') || ''
  for (const marker of ERROR_MARKERS) {
    expect(body, `${route} shows "${marker}"`).not.toContain(marker)
  }
}

// Resolve admin's first client id via the list page DOM, then navigate — but avoid
// networkidle (admin client list has no realtime; client pages DO have realtime via
// DeliverableNotifier, so networkidle would never settle).
test.describe('Admin dynamic [id] routes', () => {
  // Use a single shared test state
  let adminFirstClientId: string

  test('/admin/clients list exposes a client id', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/clients', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 20000 })
    const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
    const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
    if (!m) throw new Error(`No client ID in href: ${href}`)
    adminFirstClientId = m[1]
    console.log(`resolved client id: ${adminFirstClientId}`)
  })

  test('/admin/clients/[id] loads clean (workspace)', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await loginAsAdmin(page)
    await page.goto(`/admin/clients/${adminFirstClientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('[value="setup"]', { timeout: 30000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/admin/clients/[id]')
    if (consoleErrors.length) console.log(`[clients/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
    if (pageErrors.length) console.log(`[clients/[id]] page errors:\n  ${pageErrors.join('\n  ')}`)
  })

  test('/admin/clients/[id] tabs render', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/admin/clients/${adminFirstClientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('[value="setup"]', { timeout: 30000 })
    await expect(page.locator('[value="skills"]')).toBeAttached()
    await expect(page.locator('[value="pipeline"]')).toBeAttached()
    await expect(page.locator('[value="deliverables"]')).toBeAttached()
  })

  test('/admin/crm/[id] loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    await page.goto(`/admin/crm/${adminFirstClientId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/admin/crm/[id]')
    if (consoleErrors.length) console.log(`[crm/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/admin/deliverables/[id] doesn\'t 5xx on invalid id', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const resp = await page.goto('/admin/deliverables/invalid-id-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (resp) expect(resp.status()).toBeLessThan(500)
    if (consoleErrors.length) console.log(`[deliverables/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/admin/skills/[id] doesn\'t 5xx on invalid id', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const resp = await page.goto('/admin/skills/invalid-skill-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (resp) expect(resp.status()).toBeLessThan(500)
    if (consoleErrors.length) console.log(`[skills/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })
})

// ---- Client portal pages ----
// Note: client area has DeliverableNotifier (Supabase Realtime websocket) in the layout,
// so networkidle NEVER settles. Use domcontentloaded + explicit wait instead.
test.describe('Client portal pages', () => {
  test('/client/dashboard loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => pageErrors.push(e.message))
    await loginAsClient(page)
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1, h2', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/dashboard')
    if (consoleErrors.length) console.log(`[client/dashboard] console errors:\n  ${consoleErrors.join('\n  ')}`)
    if (pageErrors.length) console.log(`[client/dashboard] page errors:\n  ${pageErrors.join('\n  ')}`)
  })

  test('/client/deliverables loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/deliverables', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/deliverables')
    if (consoleErrors.length) console.log(`[client/deliverables] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/calendar loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/calendar', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/calendar')
    if (consoleErrors.length) console.log(`[client/calendar] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/pipeline loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/pipeline', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/pipeline')
    if (consoleErrors.length) console.log(`[client/pipeline] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/settings loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/settings', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/settings')
    if (consoleErrors.length) console.log(`[client/settings] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/approvals loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/approvals', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    expect(page.url()).not.toMatch(/\/auth\/login/)
    await assertNoErrorMarkers(page, '/client/approvals')
    if (consoleErrors.length) console.log(`[client/approvals] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/deliverables/[id] loads clean', async ({ page }) => {
    // Resolve first deliverable id from the list page
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/deliverables', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('a[href*="/client/deliverables/"]', { timeout: 20000 })
    const href = await page.locator('a[href*="/client/deliverables/"]').first().getAttribute('href')
    const m = href?.match(/\/client\/deliverables\/([a-f0-9-]+)/)
    if (m) {
      await page.goto(`/client/deliverables/${m[1]}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForSelector('h1', { timeout: 20000 })
      expect(page.url()).not.toMatch(/\/auth\/login/)
      await assertNoErrorMarkers(page, '/client/deliverables/[id]')
    }
    if (consoleErrors.length) console.log(`[client/deliverables/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })
})