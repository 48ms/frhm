import { test, expect } from '@playwright/test'

// R-35 click-through: verify the Connect Channel modal's authorize button
// behaves correctly at runtime, not just in jsdom.
test('Connect Channel modal: authorize button gating', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/preview-social-accounts')
  await page.waitForLoadState('networkidle')

  // Open the wizard from the board header.
  await page.getByRole('button', { name: /CONNECT CHANNEL/i }).click()

  const dialog = page.getByRole('dialog', { name: /Connect new channel/i })
  await expect(dialog).toBeVisible()

  // Step 1: pick a platform card to advance to the handle step.
  await dialog.getByRole('button', { name: /^Instagram$/ }).click()

  const authBtn = dialog.getByRole('button', { name: /AUTHORIZE CONNECTION/i })
  await expect(authBtn).toBeVisible()

  // Handle input empty -> button MUST be disabled.
  const disabledWhenEmpty = await authBtn.isDisabled()
  const opacityWhenEmpty = await authBtn.evaluate(
    (el) => getComputedStyle(el as HTMLElement).opacity
  )

  // Type a valid handle -> button MUST become enabled.
  await dialog.getByPlaceholder('username').fill('taraju.official')
  const disabledAfterFill = await authBtn.isDisabled()
  const opacityAfterFill = await authBtn.evaluate(
    (el) => getComputedStyle(el as HTMLElement).opacity
  )

  // Click authorize -> modal closes and a success toast appears.
  await authBtn.click()
  const toast = page.getByText(/Successfully connected/i).first()
  const toastVisible = await toast
    .waitFor({ state: 'visible', timeout: 6000 })
    .then(() => true)
    .catch(() => false)

  console.log('RESULT ' + JSON.stringify({
    disabledWhenEmpty,
    opacityWhenEmpty,
    disabledAfterFill,
    opacityAfterFill,
    toastVisible,
    errors,
  }, null, 2))

  expect(disabledWhenEmpty).toBe(true)
  expect(disabledAfterFill).toBe(false)
  expect(toastVisible).toBe(true)
})
