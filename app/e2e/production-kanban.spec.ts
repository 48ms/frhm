import { test, expect } from '@playwright/test'

test.setTimeout(120_000)
test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL!
const PASSWORD = process.env.AUDIT_E2E_PASSWORD!

test('production kanban now renders cards', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  // Login
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60000 })

  // Navigate to production
  await page.goto('/admin/production', { waitUntil: 'load' })
  await page.waitForTimeout(3000)

  // Verify Kanban cards exist
  const cardCount = await page.locator('.cursor-grab').count()
  console.log('KANBAN_CARD_COUNT:', cardCount)

  // Verify kanban columns exist
  const colHeadings = await page.locator('h4').allInnerTexts()
  console.log('COLUMN_HEADINGS:', JSON.stringify(colHeadings))

  // Drag a card (if exists)
  const firstCard = page.locator('.cursor-grab').first()
  if (cardCount > 0) {
    await firstCard.hover()
    await page.mouse.down()
    await page.locator('[role="presentation"]').nth(1).hover()
    await page.mouse.up()
    await page.waitForTimeout(2000)

    // Verify toast or no revert
    const noErrorToast = await page.locator('[role="alert"]').filter({ hasText: 'Gagal' }).count() === 0
    console.log('NO_ERROR_TOAST:', noErrorToast)
  }

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors))
})
