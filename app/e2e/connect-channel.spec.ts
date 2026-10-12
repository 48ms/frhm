import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

// R-35 click-through: verify the Connect Channel modal opens and its platform
// cards behave correctly at runtime. The modal now uses platform OAuth
// (handleStartOAuth) instead of a manual username/authorize step.
test('Connect Channel modal: platform cards and gating', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await loginAsAdmin(page)
  await page.goto('/admin/social-accounts')
  await page.waitForLoadState('networkidle')

  // Open the wizard from the board header.
  await page.getByRole('button', { name: /Connect account/i }).click()

  // Dialog name is now "Connect social account" (not "Connect new channel")
  const dialog = page.getByRole('dialog', { name: /Connect social account/i })
  await expect(dialog).toBeVisible()

  // Header
  await expect(dialog.getByText('Connect social account')).toBeVisible()

  // Platform grid renders
  await expect(dialog.getByText('Choose a platform to connect')).toBeVisible()

  // Unavailable platforms must be marked "Soon" and disabled.
  const soonCards = dialog.locator('button:has-text("Soon")')
  const soonCount = await soonCards.count()
  for (let i = 0; i < soonCount; i++) {
    await expect(soonCards.nth(i)).toBeDisabled()
  }

  console.log('RESULT ' + JSON.stringify({ soonCount, errors }, null, 2))

  // No console errors during the whole interaction.
  expect(errors.filter((e) => !e.includes('sentry'))).toHaveLength(0)
})
