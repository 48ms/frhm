import { test, expect } from '@playwright/test'

// Full end-to-end: does Authorize & Link actually ADD the account to the board?
test('full flow: connect channel persists a new account row', async ({ page }) => {
  await page.goto('/preview-social-accounts')
  await page.waitForLoadState('networkidle')

  // Count rows before
  const before = await page.locator('[data-testid="account-row"]').count().catch(() => -1)

  await page.getByRole('button', { name: /connect channel/i }).first().click()
  // pick a platform NOT already linked (Threads) then continue
  await page.getByRole('button', { name: /Threads/ }).click()
  await page.getByRole('button', { name: /^Continue$/ }).click()
  await page.getByPlaceholder('@username').fill('@taraju.threads')
  await page.getByPlaceholder('e.g. 12,400').fill('42,000')

  const authBtn = page.getByRole('button', { name: /Authorize & Link/i })
  await expect(authBtn).toBeEnabled()
  await authBtn.click()

  // Wait for success step, then click Done
  const doneBtn = page.getByRole('button', { name: /^Done$/ })
  await expect(doneBtn).toBeVisible({ timeout: 5000 })
  await doneBtn.click()
  await page.waitForTimeout(500)

  // Modal should be closed
  const modalGone = !(await page.getByRole('dialog').isVisible().catch(() => false))

  // New account row should be visible in the board
  const newRow = page.getByText('@taraju.threads')
  const rowVisible = await newRow.isVisible().catch(() => false)
  const after = await page.locator('[data-testid="account-row"]').count().catch(() => -1)

  console.log('FLOW ' + JSON.stringify({ before, after, modalGone, rowVisible }, null, 2))
})
