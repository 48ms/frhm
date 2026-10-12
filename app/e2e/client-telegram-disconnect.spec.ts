import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test('client disconnect clears clients telegram fields', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/settings')
  await page.waitForLoadState('networkidle')
  // ... test logic
})
