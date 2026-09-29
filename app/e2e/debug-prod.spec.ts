import { test, expect } from '@playwright/test'

test('debug production data', async ({ page }) => {
  await page.goto('/auth/login')
  // ... login code ...
  // wait for redirect
  await page.goto('/admin/production')
  
  // Get console logs
  page.on('console', msg => console.log(msg.text()))
  
  // Add server-side logging in page.tsx if possible, or just check the count in Kanban
  const kanban = await page.locator('.cursor-grab').count()
  console.log('KANBAN_COUNT:', kanban)
})
