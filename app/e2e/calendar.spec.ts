import { test, expect } from '@playwright/test'

test.describe('Calendar module', () => {
  test('renders calendar page with mock data', async ({ page }) => {
    await page.goto('/admin/calendar')
    // Must not error; sidebar renders + content loads
    await expect(page.locator('h1', { hasText: /Multi-Channel Dispatch/ })).toBeVisible({ timeout: 10000 })
    // Client switcher shows
    const clientBtn = page.getByRole('button', { name: /Client/ })
    await expect(clientBtn).toBeVisible()
    // Calendar view renders
    await expect(page.locator('[data-calendar]')).toHaveCount(1)
  })
})
