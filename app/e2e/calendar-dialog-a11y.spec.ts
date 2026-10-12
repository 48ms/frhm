import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.setTimeout(120_000)

test('calendar post dialog: a11y + no console errors', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await loginAsAdmin(page)
  await page.goto('/admin/calendar', { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')

  // Open the post dialog via the "Add Post" button
  const addBtn = page.getByRole('button', { name: /Add Post/i })
  await expect(addBtn.first()).toBeVisible({ timeout: 15000 })
  await addBtn.first().click()
  await page.waitForTimeout(1000)

  // Verify all form inputs inside the dialog have accessible labels
  const unlabeled = await page.evaluate(() => {
    const inputs = Array.from(
      document.querySelectorAll('[data-slot="dialog"] input, [data-slot="dialog"] textarea, [data-slot="dialog"] select')
    )
    return inputs.filter((el) => {
      const id = el.getAttribute('id')
      const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
      if (aria) return false
      if (!id) return true
      return !document.querySelector(`label[for="${id}"]`)
    }).length
  })
  expect(unlabeled, 'all dialog inputs must have accessible labels').toBe(0)

  // No uncaught page errors
  expect(pageErrors).toEqual([])
})
