import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Calendar module', () => {
  test('renders calendar page after login', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/calendar')
    await page.waitForLoadState('networkidle')

    // Main heading
    await expect(page.getByRole('heading', { name: /Multi-Channel Dispatch/i })).toBeVisible({ timeout: 10000 })
    // Calendar view renders
    await expect(page.locator('[data-calendar]')).toHaveCount(1)
  })
})
