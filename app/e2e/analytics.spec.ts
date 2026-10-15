import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Analytics & Reporting module', () => {
  test.setTimeout(120000)

  test('renders analytics dashboard with key metric cards', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/analytics')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { name: /Performance & Engagement Dynamics|AI Contextual Summary/i }).first()
    ).toBeVisible({ timeout: 15000 })

    // Key metric cards present
    for (const label of ['Aggregate Reach', 'Engagement Rate', 'Total Clicks', 'Inquiry Rate']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('renders performance insight and AI summary sections', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/analytics')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Performance Insight').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/AI Contextual Summary/i).first()).toBeVisible({ timeout: 15000 })
  })
})
