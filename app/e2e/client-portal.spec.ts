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
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 60_000 })
}

test.describe('Dedicated Client Portal & Navigation Shell', () => {
  test('client portal layout, executive navigation, and view accessibility', async ({ page }) => {
    await login(page)

    // Navigate to Client Portal
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')

    // 1. Verify Client Navigation Shell
    const clientNav = page.locator('nav[aria-label="Client Navigation"]')
    await expect(clientNav).toBeVisible({ timeout: 15_000 })

    // Verify client links exist
    await expect(clientNav.locator('a[href^="/client/dashboard"]')).toBeVisible()
    await expect(clientNav.locator('a[href^="/client/calendar"]')).toBeVisible()
    await expect(clientNav.locator('a[href^="/client/review"]')).toBeVisible()
    await expect(clientNav.locator('a[href^="/client/analytics"]')).toBeVisible()
    await expect(clientNav.locator('a[href^="/client/assets"]')).toBeVisible()
    await expect(clientNav.locator('a[href^="/client/support"]')).toBeVisible()

    // 2. Verify Internal Agency Tools are HIDDEN from Client Portal
    await expect(page.locator('a[href*="/admin/erp"]')).toHaveCount(0)
    await expect(page.locator('a[href*="/admin/ai"]')).toHaveCount(0)

    // 3. Navigate to Client Deliverables Review Hub
    await clientNav.locator('a[href^="/client/review"]').click()
    await page.waitForURL(/\/client\/review/, { timeout: 15_000 })
    await expect(page.getByText('Deliverables & Review Hub')).toBeVisible({ timeout: 15_000 })

    // 4. Navigate to Client Content Calendar
    await clientNav.locator('a[href^="/client/calendar"]').click()
    await page.waitForURL(/\/client\/calendar/, { timeout: 15_000 })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // 5. Navigate to Client Support Hotline
    await clientNav.locator('a[href^="/client/support"]').click()
    await page.waitForURL(/\/client\/support/, { timeout: 15_000 })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('admin clients workspace has Akses Klien action', async ({ page }) => {
    await login(page)

    await page.goto('/admin/clients')
    await page.waitForLoadState('networkidle')

    // Verify Akses Klien button is visible on client card
    const aksesBtn = page.getByRole('button', { name: /Akses Klien/i }).first()
    await expect(aksesBtn).toBeVisible({ timeout: 15_000 })
    await aksesBtn.click()

    // Verify dialog opens with client user management
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Akses Portal Klien/i)).toBeVisible()
    await expect(page.getByText(/Tambah Pengguna Klien Baru/i)).toBeVisible()
  })
})
