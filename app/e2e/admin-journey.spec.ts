import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Composer module', () => {
  test.setTimeout(120000)

  test('renders either the empty state or the full 4-step workflow', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/composer')
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/Belum ada akun|hubungkan akun/i)
    const isEmptyVisible = await emptyState.first().isVisible().catch(() => false)

    if (isEmptyVisible) {
      // Empty state must not leak an undefined client id into its links.
      await expect(page).not.toHaveURL(/clientId=undefined/)
      return
    }

    // Full workflow: 4-step indicator
    await expect(page.getByText('Tulis / Upload')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Pilih Platform')).toBeVisible()
    await expect(page.getByText('Atur Jadwal')).toBeVisible()
    await expect(page.getByText('Publish')).toBeVisible()

    // Step 1 fields have associated labels (WCAG 1.3.1)
    await expect(page.getByLabel('Judul Postingan / Referensi Internal')).toBeVisible()
    await expect(page.getByLabel('Caption & Copywriting')).toBeVisible()
  })

  test('all composer form inputs have accessible labels', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/composer')
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/Belum ada akun|hubungkan akun/i)
    const isEmptyVisible = await emptyState.first().isVisible().catch(() => false)
    if (isEmptyVisible) return

    const unlabeled = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return -1
      const inputs = Array.from(main.querySelectorAll('input, textarea, select'))
        // Ignore hidden/submit inputs and platform checkbox toggles (they have aria-labels)
        .filter((el) => el.getAttribute('type') !== 'hidden')
      return inputs.filter((el) => {
        const id = el.getAttribute('id')
        const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
        if (aria) return false
        if (!id) return true
        return !document.querySelector(`label[for="${id}"]`)
      }).length
    })
    expect(unlabeled, 'all composer inputs must have accessible labels').toBe(0)
  })
})
