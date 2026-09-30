import { test, expect } from '@playwright/test'

test.describe('Support Center', () => {
  test('renders sections and expands an FAQ item', async ({ page }) => {
    await page.goto('/preview-support')

    await expect(page.locator('text=Support Center').first()).toBeVisible()
    await expect(page.locator('text=Email Support')).toBeVisible()
    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible()
    await expect(page.locator('text=Your Recent Tickets')).toBeVisible()

    // FAQ item 0 is open by default; toggling another expands it
    await page.getByRole('button', { name: /Why is a scheduled post stuck/i }).click()
    await expect(
      page.locator('text=The Strict Client Approval Gate blocks publishing')
    ).toBeVisible()
  })

  test('submitting the contact form shows a success toast', async ({ page }) => {
    await page.goto('/preview-support')

    await page.getByLabel(/Subject/i).fill('Reels publish failing')
    await page.getByLabel(/Message/i).fill('Posts stay queued for the active client workspace.')
    await page.getByRole('button', { name: /Submit Request/i }).click()

    await expect(page.locator('text=Support request submitted').first()).toBeVisible()
  })
})
