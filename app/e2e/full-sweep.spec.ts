import { test, expect } from '@playwright/test'

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

async function assertClean(page: import('@playwright/test').Page, route: string) {
  expect(page.url()).not.toMatch(/\/auth\/login/)
  const body = await page.locator('body').innerText().catch(() => '') || ''
  for (const marker of ERROR_MARKERS) {
    expect(body).not.toContain(marker)
  }
  return body
}

// Resolve first client ID from DOM — called fresh in each test
async function resolveClientId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 15000 })
  const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
  if (!m) throw new Error(`No client ID in href: ${href}`)
  return m[1]
}

async function resolveDeliverableId(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/admin/deliverables', { waitUntil: 'domcontentloaded', timeout: 30000 })
  try {
    await page.waitForSelector('a[href*="/admin/deliverables/"]', { timeout: 10000 })
    const href = await page.locator('a[href*="/admin/deliverables/"]').first().getAttribute('href')
    const m = href?.match(/\/admin\/deliverables\/([a-f0-9-]+)/)
    return m?.[1] ?? null
  } catch { return null }
}

async function resolveClientDeliverableId(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/client/deliverables', { waitUntil: 'domcontentloaded', timeout: 30000 })
  try {
    await page.waitForSelector('a[href*="/client/deliverables/"]', { timeout: 10000 })
    const href = await page.locator('a[href*="/client/deliverables/"]').first().getAttribute('href')
    const m = href?.match(/\/client\/deliverables\/([a-f0-9-]+)/)
    return m?.[1] ?? null
  } catch { return null }
}

// ============================================================================
// ADMIN DYNAMIC [id] ROUTES
// ============================================================================
test.describe('Admin dynamic [id] routes', () => {
  test('/admin/clients/[id] loads clean (workspace)', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const clientId = await resolveClientId(page)
    console.log(`[workspace] client_id=${clientId}`)
    const t0 = Date.now()
    await page.goto(`/admin/clients/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    console.log(`[workspace] elapsed: ${Date.now() - t0}ms`)
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
    await assertClean(page, '/admin/clients/[id]')
    if (consoleErrors.length) console.log(`[workspace] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/admin/clients/[id] tabs render with role=tab', async ({ page }) => {
    await loginAsAdmin(page)
    const clientId = await resolveClientId(page)
    await page.goto(`/admin/clients/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
    const tabCount = await page.locator('[role="tab"]').count()
    expect(tabCount, 'tab count').toBeGreaterThan(0)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toContain('Client Setup')
    expect(bodyText).toContain('Pipeline')
  })

  test('/admin/crm/[id] loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const clientId = await resolveClientId(page)
    await page.goto(`/admin/crm/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await assertClean(page, '/admin/crm/[id]')
    if (consoleErrors.length) console.log(`[crm] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/admin/deliverables/[id] loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const delivId = await resolveDeliverableId(page)
    if (delivId) {
      const resp = await page.goto(`/admin/deliverables/${delivId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      expect(resp?.status()).toBeLessThan(500)
      await assertClean(page, '/admin/deliverables/[id]')
    } else {
      const resp = await page.goto('/admin/deliverables/invalid-id-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
      expect(resp?.status()).toBeLessThan(500)
    }
    if (consoleErrors.length) console.log(`[deliverables/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/admin/skills/[id] loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsAdmin(page)
    const resp = await page.goto('/admin/skills/nonexistent-skill-12345', { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (resp) expect(resp.status()).toBeLessThan(500)
    if (consoleErrors.length) console.log(`[skills/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })
})

// ============================================================================
// CLIENT PORTAL PAGES
// ============================================================================
test.describe('Client portal pages', () => {
  test('/client/dashboard loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1, h2', { timeout: 20000 })
    await assertClean(page, '/client/dashboard')
    if (consoleErrors.length) console.log(`[dashboard] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/deliverables loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/deliverables', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    await assertClean(page, '/client/deliverables')
    if (consoleErrors.length) console.log(`[deliverables] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/calendar loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/calendar', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    await assertClean(page, '/client/calendar')
    if (consoleErrors.length) console.log(`[calendar] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/pipeline loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/pipeline', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    await assertClean(page, '/client/pipeline')
    if (consoleErrors.length) console.log(`[pipeline] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/settings loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/settings', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h1', { timeout: 20000 })
    await assertClean(page, '/client/settings')
    if (consoleErrors.length) console.log(`[settings] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/approvals loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    await page.goto('/client/approvals', { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForSelector('h2', { timeout: 20000 })
    await assertClean(page, '/client/approvals')
    if (consoleErrors.length) console.log(`[approvals] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })

  test('/client/deliverables/[id] loads clean', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    await loginAsClient(page)
    const delivId = await resolveClientDeliverableId(page)
    if (delivId) {
      const resp = await page.goto(`/client/deliverables/${delivId}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      expect(resp?.status()).toBeLessThan(500)
      await assertClean(page, '/client/deliverables/[id]')
    } else {
      const resp = await page.goto('/client/deliverables/invalid-id', { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (resp) expect(resp.status()).toBeLessThan(500)
    }
    if (consoleErrors.length) console.log(`[deliverables/[id]] console errors:\n  ${consoleErrors.join('\n  ')}`)
  })
})