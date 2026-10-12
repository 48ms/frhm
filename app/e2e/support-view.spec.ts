import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Support Center', () => {
  test('renders sections and expands an FAQ item', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/support')

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
    await loginAsAdmin(page)
    await page.goto('/admin/support')

    await page.getByLabel(/Subject/i).fill('Reels publish failing')
    await page.getByLabel(/Message/i).fill('Posts stay queued for the active client workspace.')
    await page.getByRole('button', { name: /Submit Request/i }).click()

    await expect(page.locator('text=Tiket dukungan dikirim').first()).toBeVisible()
  })
})
