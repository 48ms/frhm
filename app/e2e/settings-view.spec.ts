import { test, expect } from '@playwright/test'

test.describe('Settings View', () => {
  test('renders workspace tab by default and switches tabs via nuqs', async ({ page }) => {
    await page.goto('/preview-settings')

    // Workspace tab active by default
    await expect(page.locator('text=Agency Workspace Profile')).toBeVisible()
    
    // Switch to Billing
    await page.getByRole('tab', { name: /Billing/i }).click()
    await expect(page).toHaveURL(/tab=billing/)
    await expect(page.locator('text=Enterprise Multi-Seat Agency Tier').first()).toBeVisible()

    // Switch to Integrations
    await page.getByRole('tab', { name: /Integrations/i }).click()
    await expect(page).toHaveURL(/tab=integrations/)
    await expect(page.locator('text=Connected Social & Ops Channels').first()).toBeVisible()

    // Switch to User Access
    await page.getByRole('tab', { name: /User Access/i }).click()
    await expect(page).toHaveURL(/tab=user-access/)
    await expect(page.locator('text=Security & Single Sign-On').first()).toBeVisible()
  })
})
