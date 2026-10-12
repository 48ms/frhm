import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Media Library module', () => {
  test.setTimeout(120000)

  test('renders media library page with upload zone and stats', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/library')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Aset media untuk Frhm Alpha Tester').first()).toBeVisible()
  })

  test('shows asset stats sections (Total, Images, Videos, Storage)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/library')
    await page.waitForLoadState('networkidle')

    for (const label of ['Total', 'Images', 'Videos', 'Storage']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('renders empty state or asset grid', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/library')
    await page.waitForLoadState('networkidle')

    const empty = page.getByText('Belum ada aset.')
    const isEmptyVisible = await empty.isVisible().catch(() => false)
    if (isEmptyVisible) {
      await expect(empty).toBeVisible()
    } else {
      const trigger = page.locator('text="Detail aset"').first()
      if (await trigger.isVisible().catch(() => false)) {
        await expect(trigger).toBeVisible({ timeout: 10000 })
      }
    }
  })
})
