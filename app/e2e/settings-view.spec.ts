import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/login'

test.describe('Settings View', () => {
  test.setTimeout(120000)

  test('renders workspace tab by default and switches tabs via nuqs', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')

    // Tablist renders with the four sections
    const tablist = page.getByRole('tablist', { name: 'Settings sections' })
    await expect(tablist).toBeVisible({ timeout: 15000 })
    await expect(tablist.getByRole('tab', { name: 'Workspace' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: 'Billing' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: 'Integrations' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: 'User Access' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: 'Brand Profile' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: 'AI Providers' })).toBeVisible()
  })

  test('switches to Billing tab via nuqs URL state', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=billing')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true')
  })

  test('switches to Integrations tab and shows channel integrations', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=integrations')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: 'Integrations' })).toHaveAttribute('aria-selected', 'true')
  })

  test('switches to User Access tab and shows team members table', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=user-access')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: 'User Access' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
  })

  test('switches to Brand Profile tab and shows brand identity form', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=brand-profile')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: 'Brand Profile' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Identitas & Brand Profile')).toBeVisible({ timeout: 10000 })
  })

  test('switches to AI Providers tab and shows provider management', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/settings?tab=ai-providers')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('tab', { name: 'AI Providers' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('AI Model & Provider Endpoints')).toBeVisible({ timeout: 10000 })
  })
})
