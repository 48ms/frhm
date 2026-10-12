import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL!
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD!

test.describe('Marketing ERP dashboard', () => {
  test.setTimeout(120000)
  test('renders summary strip, schedule banner and client info after login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('E-mail').waitFor({ state: 'visible' })
    await page.getByLabel('E-mail').fill(ADMIN_EMAIL)
    await page.getByPlaceholder('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()

    await page.waitForURL('**/admin/**', { timeout: 60_000 })

    await page.goto('/admin/erp')
    await page.waitForLoadState('networkidle')

    // Title + subtitle
    await expect(page.getByText('Dashboard', { exact: true })).toBeVisible()
    await expect(page.getByText('Ringkasan deliverable dan performa konten klien')).toBeVisible()

    // Summary strip
    await expect(page.getByText('TOTAL DELIVERABLE', { exact: true })).toBeVisible()
    await expect(page.getByText('Menunggu review client', { exact: true })).toBeVisible()
    await expect(page.getByText('Perlu revisi dari kamu', { exact: true })).toBeVisible()
    await expect(page.getByText('Disetujui, siap publish', { exact: true })).toBeVisible()

    // Today's schedule banner
    await expect(page.getByRole('heading', { name: /Jadwal Tayang Hari Ini/i })).toBeVisible()

    // Client Active
    await expect(page.getByRole('heading', { name: /Klien Aktif/i })).toBeVisible()
  })
})
