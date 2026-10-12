import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Sidebar client switcher (nuqs URL state)', () => {
  test('workspace switcher opens and lists managed clients', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // The switcher trigger shows the active client name.
    const clientBtn = page.getByRole('button', { name: /Frhm Alpha Tester/ }).first()
    await expect(clientBtn).toBeVisible()
    await clientBtn.click()

    // The popover opens as a listbox with the "Switch Workspace" heading.
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    await expect(listbox.getByText('Switch Workspace')).toBeVisible()

    // The managed client is listed as an option, marked selected (active).
    const option = listbox.getByRole('option', { name: /Frhm Alpha Tester/ })
    await expect(option).toBeVisible()
    await expect(option).toHaveAttribute('aria-selected', 'true')

    // Selecting the active client keeps the URL scoped with ?clientId= (nuqs).
    await option.click()
    await expect(page).toHaveURL(/clientId=/)
  })
})
