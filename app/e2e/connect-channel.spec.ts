import { test, expect } from '@playwright/test'

// R-35 click-through: verify the Connect Channel modal's Authorize button
// behaves correctly at runtime, not just in jsdom.
test('Connect Channel modal: Authorize button gating', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/preview-social-accounts')
  await page.waitForLoadState('networkidle')

  // Open the "Connect Channel" wizard (button in the board header).
  const connectBtn = page.getByRole('button', { name: /connect/i }).first()
  await connectBtn.click()

  // Step 1 -> Continue to details
  await page.getByRole('button', { name: /^Continue$/ }).click()

  const authBtn = page.getByRole('button', { name: /Authorize & Link/i })
  await expect(authBtn).toBeVisible()

  // Handle input is empty -> button MUST be disabled
  const disabledWhenEmpty = await authBtn.isDisabled()
  const opacityWhenEmpty = await authBtn.evaluate(
    (el) => getComputedStyle(el as HTMLElement).opacity
  )
  const bgWhenEmpty = await authBtn.evaluate(
    (el) => getComputedStyle(el as HTMLElement).backgroundColor
  )

  // Type a valid handle -> button MUST become enabled
  await page.getByPlaceholder('@username').fill('@taraju.official')
  const disabledAfterFill = await authBtn.isDisabled()
  const opacityAfterFill = await authBtn.evaluate(
    (el) => getComputedStyle(el as HTMLElement).opacity
  )

  // Click Authorize -> must reach the authorizing/success step
  await authBtn.click()
  await page.waitForTimeout(2200)
  const successVisible = await page
    .getByText(/Channel linked successfully|Opening secure OAuth/i)
    .first()
    .isVisible()
    .catch(() => false)

  console.log('RESULT ' + JSON.stringify({
    disabledWhenEmpty,
    opacityWhenEmpty,
    bgWhenEmpty,
    disabledAfterFill,
    opacityAfterFill,
    successVisible,
    errors,
  }, null, 2))

  expect(disabledWhenEmpty).toBe(true)
  expect(disabledAfterFill).toBe(false)
  expect(successVisible).toBe(true)
})
