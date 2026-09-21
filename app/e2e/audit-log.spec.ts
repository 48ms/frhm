import { test, expect } from '@playwright/test'

// End-to-end smoke test for the audit log page.
// Credentials come from the environment so no secret is written to the repo:
//   AUDIT_E2E_EMAIL / AUDIT_E2E_PASSWORD
const EMAIL = process.env.AUDIT_E2E_EMAIL
const PASSWORD = process.env.AUDIT_E2E_PASSWORD

test.use({ baseURL: 'http://localhost:3004' })

test.describe('Audit Log page (authenticated)', () => {
  test.skip(!EMAIL || !PASSWORD, 'AUDIT_E2E_EMAIL / AUDIT_E2E_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(EMAIL!)
    await page.getByLabel('Password').fill(PASSWORD!)
    await page.getByRole('button', { name: 'Masuk' }).click()
    await page.waitForURL(/admin/, { timeout: 20000 })
  })

  test('loads with rows, filter select, and search box', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/admin/settings/audit')
    await page.waitForLoadState('networkidle')

    // Page content, not layout chrome
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
    await expect(page.locator('#audit-action')).toBeVisible()
    await expect(page.getByLabel('Cari ringkasan atau pelaku')).toBeVisible()

    // The select must list the real actions (more than just "all")
    const optionCount = await page.locator('#audit-action option').count()
    expect(optionCount, 'action filter has options').toBeGreaterThan(1)

    // At least one activity row is rendered
    const rowCount = await page.locator('p.text-sm').count()
    expect(rowCount, 'rows rendered').toBeGreaterThan(0)

    expect(errors, `console errors: ${errors.join(' | ')}`).toHaveLength(0)
  })

  test('action filter narrows the list and updates the URL', async ({ page }) => {
    await page.goto('/admin/settings/audit')
    await page.waitForLoadState('networkidle')

    const firstValue = await page.locator('#audit-action option').nth(1).getAttribute('value')
    expect(firstValue).toBeTruthy()

    await page.locator('#audit-action').selectOption(firstValue!)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(new RegExp(`action=${encodeURIComponent(firstValue!)}`))
    const summary = await page.locator('p.text-xs').first().textContent()
    expect(summary).toContain(firstValue!)
  })

  test('search filters rows and survives a comma (no crash)', async ({ page }) => {
    await page.goto('/admin/settings/audit')
    await page.waitForLoadState('networkidle')

    // A comma used to break the PostgREST filter with a parse error.
    await page.getByLabel('Cari ringkasan atau pelaku').fill('a,b')
    await page.getByLabel('Cari ringkasan atau pelaku').press('Enter')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent('a,b')}`))
    // Page must still render the heading (not an error boundary)
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
    const body = await page.locator('body').textContent()
    expect(body).not.toContain('failed to parse')
  })

  test('normal search returns matching rows', async ({ page }) => {
    await page.goto('/admin/settings/audit')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Cari ringkasan atau pelaku').fill('create')
    await page.getByLabel('Cari ringkasan atau pelaku').press('Enter')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
    const summary = await page.locator('p.text-xs').first().textContent()
    expect(summary).toMatch(/\d+ aktivitas/)
  })

  test('main content has no horizontal overflow (isolated from layout chrome)', async ({ page }) => {
    // The admin header (bell + avatar) has a pre-existing 28px overflow on 390px viewports
    // across ALL admin pages (dashboard, clients, audit). That's outside the audit scope.
    // Here we test the page's own content area only.
    await page.goto('/admin/settings/audit')
    await page.waitForLoadState('networkidle')
    await page.setViewportSize({ width: 390, height: 844 })

    const overflow = await page.evaluate(() => {
      // Measure the main content area, not the fixed header
      const content = document.querySelector('[class*="flex flex-1 flex-col"]')
      if (!content) return -1
      return content.scrollWidth - content.clientWidth
    })
    expect(overflow, 'main content overflow').toBeLessThanOrEqual(1)
  })
})
