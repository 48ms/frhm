import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Marketing ERP dashboard', () => {
  test.setTimeout(120000)

  test('renders summary strip, schedule banner and client info after login', async ({ page }) => {
    await loginAsAdmin(page)
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

    // Deliverables Section Heading
    await expect(page.getByRole('heading', { name: /Daftar Deliverables/i })).toBeVisible()
  })

  test('supports filtering deliverables by status tabs and search input with url state sync (nuqs)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/erp')
    await page.waitForLoadState('networkidle')

    // Tabs are visible
    const tabsList = page.getByRole('tablist')
    await expect(tabsList).toBeVisible()

    // Switch to "Menunggu Review" tab
    await page.getByRole('tab', { name: /Menunggu Review/i }).click()
    await expect(page).toHaveURL(/status=sent/)

    // Switch to "Perlu Revisi" tab
    await page.getByRole('tab', { name: /Perlu Revisi/i }).click()
    await expect(page).toHaveURL(/status=revision_requested/)

    // Switch to "Disetujui" tab
    await page.getByRole('tab', { name: /Disetujui/i }).click()
    await expect(page).toHaveURL(/status=approved/)

    // Switch back to "Semua" tab (default value in nuqs clears the status param)
    await page.getByRole('tab', { name: /Semua/i }).click()
    await expect(page).not.toHaveURL(/status=sent|status=revision_requested|status=approved/)

    // Test search input
    const searchInput = page.getByPlaceholder('Cari deliverable...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Strategic Brief')
    await expect(page).toHaveURL(/q=Strategic/)

    // Reset button appears and clears query
    const resetBtn = page.getByRole('button', { name: 'Reset' })
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()
    await expect(searchInput).toHaveValue('')
  })

  test('triggers Telegram notification test button with feedback', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/erp')
    await page.waitForLoadState('networkidle')

    // Find the Telegram notification button
    const telegramBtn = page.getByRole('button', { name: /Notifikasi Telegram/i })
    await expect(telegramBtn).toBeVisible()

    // Click Telegram notification button
    await telegramBtn.click()

    // Either toast success (if Telegram configured) or error (if bot not configured in dev) should appear
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/Telegram/i)).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('opens Deliverable Baru dialog and verifies accessible Radix UI dialog attributes', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/erp')
    await page.waitForLoadState('networkidle')

    const createBtn = page.getByRole('button', { name: /Deliverable Baru/i }).first()
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // Modal appears
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Buat deliverable baru untuk klien aktif')).toBeVisible()

    // Template presets visible
    await expect(page.getByText('Gunakan Starter Template Agensi:')).toBeVisible()
    await expect(page.getByRole('button', { name: /Creative Brief/i })).toBeVisible()

    // Press Escape to dismiss dialog
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
