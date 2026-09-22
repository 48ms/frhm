import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL!
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD!
const CLIENT_ID = process.env.CLIENT_ID ?? "44b48931-a33e-470a-9f3e-9064ee46373f"; // Taraju

test('budget form modal submits to DB', async ({ page }) => {
  // Capture budget POSTs
  const postLogs: number[] = []
  page.on('response', (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/budgets')) {
      postLogs.push(r.status())
    }
  })

  // Login
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 15000 })

  // Navigate to client detail
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Click Budget Ledger tab
  await page.getByText('Budget Ledger', { exact: true }).click()
  await page.waitForTimeout(1500)

  // Verify Add button exists
  const addBtn = page.getByRole('button', { name: /Set Budget/i }).first()
  await expect(addBtn).toBeVisible()
  await addBtn.click()
  await page.waitForTimeout(500)

  // Fill form
  await page.locator('#month').fill('2026-09')
  await page.locator('#total_budget').fill('5000000')

  // Submit
  await page.getByRole('button', { name: /Simpan/i }).click()

  // Wait for POST and verify
  await expect(async () => {
    expect(postLogs.length).toBeGreaterThan(0)
  }).toPass({ timeout: 10000 })

  // Verify no validation errors on page
  const errors = await page.locator('.text-red-500').allTextContents()
  expect(errors).toHaveLength(0)

  console.log(`POST budgets status: ${postLogs}`)
})
