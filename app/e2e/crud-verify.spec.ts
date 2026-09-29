import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3004' })

const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL ?? 'test-user@frhm.dev'
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD ?? 'TestPass123!'
const CLIENT_EMAIL = process.env.CLIENT_E2E_EMAIL ?? 'taraju.test.4fd43222@gmail.com'
const CLIENT_PASSWORD = process.env.CLIENT_E2E_PASSWORD ?? 'TestPass123!'

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 })
}

async function loginClient(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(CLIENT_EMAIL)
  await page.getByLabel('Password').fill(CLIENT_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/client(\/|$)/, { timeout: 20000 })
}

/** Resolve first client ID from /admin/clients page */
async function resolveClientId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 15000 })
  const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
  if (!m) throw new Error(`No client ID in: ${href}`)
  return m[1]
}
// CRITICAL CRUD: users (create+delete+audit_log)
test('CRUD: user management create → list → delete → audit_log', async ({ page }) => {
  await loginAdmin(page)
  
  const stamp = Date.now()
  const email = `crud-user-${stamp}@test.frhm`
  
  // CREATE via API
  const createRes = await page.request.post('/api/admin/users', {
    data: { email, password: 'CrudTest123!', full_name: `CRUD ${stamp}`, role: 'client', client_id: null },
  })
  expect(createRes.status(), `create failed: ${await createRes.text()}`).toBe(200)
  const created = await createRes.json()
  const userId = created.user.id
  console.log(`CREATE user: ${userId}`)

  // READ - verify in list
  const listRes = await page.request.get('/api/admin/users')
  expect(listRes.status()).toBe(200)
  const { users } = await listRes.json()
  const found = users.find((u: { id: string }) => u.id === userId)
  expect(found, 'user must appear in list').toBeTruthy()
  expect(found.email).toBe(email)
  console.log(`READ user email: ${found.email}`)

  // DELETE
  const delRes = await page.request.delete(`/api/admin/users/${userId}`)
  expect(delRes.status(), `delete failed: ${await delRes.text()}`).toBe(200)
  console.log('DELETE user: success')

  // VERIFY audit_log has user.create and user.delete
  await page.waitForTimeout(2000)
  const { execSync } = require('child_process')
  const createAudit = execSync(`python3 scripts/dbq.py "audit_log?action=eq.user.create&entity_id=eq.${userId}&select=id,action"`, 
    { cwd: 'C:/Users/bimam/Downloads/Tools Frahma/app', encoding: 'utf-8', timeout: 30000 })
  const deleteAudit = execSync(`python3 scripts/dbq.py "audit_log?action=eq.user.delete&entity_id=eq.${userId}&select=id,action"`,
    { cwd: 'C:/Users/bimam/Downloads/Tools Frahma/app', encoding: 'utf-8', timeout: 30000 })
  
  console.log(`CREATE AUDIT: ${createAudit}`)
  console.log(`DELETE AUDIT: ${deleteAudit}`)
  expect(createAudit, 'audit_log must have user.create').toContain('user.create')
  expect(deleteAudit, 'audit_log must have user.delete').toContain('user.delete')
  console.log('AUDIT_LOG verified: ✅')
})
// CRITICAL CRUD: campaign (create+verify)
test('CRUD: campaign form submits POST to /api/admin/clients/[id]/campaigns', async ({ page }) => {
  const postLogs: number[] = []
  page.on('response', (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/campaigns')) {
      postLogs.push(r.status())
    }
  })
  
  await loginAdmin(page)
  const clientId = await resolveClientId(page)
  
  // Navigate to campaign form
  await page.goto('/admin/planning/new', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Select client
  await page.locator('#client').click()
  await page.getByRole('option', { name: /Taraju/i }).click()
  
  // Fill campaign name
  await page.getByLabel('Nama Kampanye').fill('CRUD Campaign Test')
  await page.locator('#type').click()
  await page.getByRole('option', { name: /Kampanye/i }).click()
  
  // Submit and wait for POST
  await page.getByRole('button', { name: /Simpan Kampanye/i }).click()
  
  // Verify POST was called
  await expect(async () => {
    expect(postLogs.length).toBeGreaterThan(0)
  }).toPass({ timeout: 15000 })
  
  console.log(`POST campaigns status: ${postLogs}`)
  
  // Verify redirect to calendar
  await page.waitForURL(/\/admin\/calendar/, { timeout: 15000 })
  expect(page.url()).toContain('/admin/calendar')
  console.log('CRUD campaign: ✅')
})
// CRITICAL CRUD: budget (create+verify)
test('CRUD: budget form submits POST to /api/admin/clients/[id]/budgets', async ({ page }) => {
  const postLogs: number[] = []
  page.on('response', (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/budgets')) {
      postLogs.push(r.status())
    }
  })
  
  await loginAdmin(page)
  const clientId = process.env.CLIENT_ID ?? "44b48931-a33e-470a-9f3e-9064ee46373f" // Taraju
  
  await page.goto(`/admin/clients/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)
  
  // Click Budget Ledger tab
  await page.getByText('Budget Ledger', { exact: true }).click()
  await page.waitForTimeout(1500)
  
  // Click Set Budget button
  const addBtn = page.getByRole('button', { name: /Set Budget/i }).first()
  await expect(addBtn).toBeVisible()
  await addBtn.click()
  await page.waitForTimeout(500)
  
  // Fill form
  await page.locator('#month').fill('2026-10')
  await page.locator('#total_budget').fill('10000000')
  
  // Submit
  await page.getByRole('button', { name: /Simpan/i }).click()
  
  // Verify POST
  await expect(async () => {
    expect(postLogs.length).toBeGreaterThan(0)
  }).toPass({ timeout: 10000 })
  
  console.log(`POST budgets status: ${postLogs}`)
  
  // Verify no validation errors
  const errors = await page.locator('.text-red-500').allTextContents()
  expect(errors).toHaveLength(0)
  console.log('CRUD budget: ✅')
})
