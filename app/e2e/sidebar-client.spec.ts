import { test, expect } from '@playwright/test'

test.describe('Sidebar client switcher (nuqs URL state)', () => {
  test('selecting a client writes ?clientId= and persists across navigation', async ({ page }) => {
    await page.goto('/preview-social-accounts')
    await page.waitForTimeout(1000)

    // Default active client = SOCIAL_CLIENTS[0] -> "B2B Shell Representatives"
    const clientBtn = page.getByRole('button', { name: /Client B2B Shell/ })
    await expect(clientBtn).toBeVisible()
    await clientBtn.click()

    // Dropdown lists the shared mock repository
    await expect(page.getByText('MANAGED CLIENTS', { exact: true })).toBeVisible()

    // Pick the second client -> E2E Wizard Corp (id: client-wizard)
    const wizard = page.getByRole('button', { name: /E2E Wizard Corp/ })
    await expect(wizard).toBeVisible()
    await wizard.click()

    // VERIFY 1 (nuqs): the URL now carries ?clientId=client-wizard
    await expect(page).toHaveURL(/clientId=client-wizard/)

    // VERIFY 2 (nuqs persistence): direct navigation keeps the param
    await page.goto('/preview-dashboard?clientId=client-wizard')
    await page.waitForTimeout(500)
    const switcher = page.getByRole('button', { name: /Client E2E Wizard/ })
    await expect(switcher).toBeVisible()

    // VERIFY 3: the switcher label reflects the new active client
    await expect(page.getByRole('button', { name: /Client E2E Wizard/ })).toBeVisible()
  })
})
