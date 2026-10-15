import { test, expect } from '@playwright/test'
import { loginAsAdmin, getActiveClientName } from './helpers/login'

test.describe('Sidebar client switcher (nuqs URL state)', () => {
  test('workspace switcher opens and lists managed clients', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // The switcher trigger shows the active client name (resolved from the
    // live workspace switcher rather than a hardcoded seed name).
    const clientName = await getActiveClientName(page)
    expect(clientName, 'active client name must resolve from the workspace switcher').toBeTruthy()

    const clientBtn = page.locator('[aria-label^="Current workspace:"]').first()
    await expect(clientBtn).toBeVisible()
    await clientBtn.click()

    // The popover opens as a menu with the "Switch Workspace" heading.
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByText('Switch Workspace')).toBeVisible()

    // The active client is listed as an option, marked selected.
    const option = menu.getByRole('menuitem', { name: new RegExp(escapeRegExp(clientName!)) })
    await expect(option.first()).toBeVisible()

    // Selecting the active client keeps the URL scoped with ?clientId= (nuqs).
    await option.first().click()
    await expect(page).toHaveURL(/clientId=/)
  })
})

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
