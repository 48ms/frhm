import { test, expect } from '@playwright/test'

test.describe('Marketing ERP dashboard', () => {
  test('renders summary strip, schedule banner and per-client grid', async ({ page }) => {
    await page.goto('/preview-erp')
    await page.waitForLoadState('networkidle')

    // Title + subtitle
    await expect(page.getByRole('heading', { name: /^Dashboard$/ })).toBeVisible()
    await expect(page.getByText(/Ringkasan deliverable/i)).toBeVisible()

    // Summary strip
    await expect(page.getByText(/TOTAL DELIVERABLE/i)).toBeVisible()
    await expect(page.getByText(/Menunggu review client/i)).toBeVisible()
    await expect(page.getByText(/Perlu revisi dari kamu/i)).toBeVisible()
    await expect(page.getByText(/Disetujui, siap publish/i)).toBeVisible()

    // Today's schedule banner
    await expect(page.getByRole('heading', { name: /Jadwal Tayang Hari Ini/i })).toBeVisible()

    // Per Client grid
    await expect(page.getByRole('heading', { name: /Per Client/i })).toBeVisible()
    await expect(page.getByText(/Tambah client/i)).toBeVisible()
    await expect(page.getByText(/Progres skill/i).first()).toBeVisible()
  })
})
