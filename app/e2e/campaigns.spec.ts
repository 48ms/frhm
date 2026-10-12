import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Campaigns module', () => {
  test.setTimeout(120000)

  test('renders campaigns board with header and launch CTA', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/campaigns')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Campaigns Orchestration' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Manage multi-channel brand campaigns')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Launch Campaign' }).first()).toBeVisible()
  })

  test('opens create campaign modal from Launch Campaign button', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/campaigns')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Launch Campaign' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByText('Launch a new client campaign')).toBeVisible()

    // 3-step wizard indicator
    await expect(dialog.getByText('Basics')).toBeVisible()
    await expect(dialog.getByText('Schedule')).toBeVisible()
    await expect(dialog.getByText('Review')).toBeVisible()

    // Required field: Campaign Name
    await expect(dialog.getByLabel('Campaign Name')).toBeVisible()

    // Close modal via close button
    await dialog.getByRole('button').first().click()
    await expect(dialog).not.toBeVisible()
  })

  test('validates campaign name required (Continue button is disabled)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/campaigns')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Launch Campaign' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // When campaign name is empty, the Continue button must be disabled
    const continueBtn = dialog.getByRole('button', { name: 'Continue' })
    await expect(continueBtn).toBeDisabled()

    // Typing a name enables the button
    await dialog.getByLabel('Campaign Name').fill('Q4 Brand Campaign')
    await expect(continueBtn).toBeEnabled()
  })

  test('filter status dropdown lists all tabs', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/campaigns')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Filter Status' }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 5000 })

    for (const t of ['All', 'Active', 'Review', 'Completed', 'Draft']) {
      await expect(menu.getByRole('menuitemradio', { name: t })).toBeVisible()
    }
  })
})
