import type { Page } from '@playwright/test'

const EMAIL = process.env.AUDIT_E2E_EMAIL
const PASSWORD = process.env.AUDIT_E2E_PASSWORD

/**
 * Shared login helper for the E2E suite.
 *
 * REQUIRES: AUDIT_E2E_EMAIL and AUDIT_E2E_PASSWORD in .env.local
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    throw new Error('E2E credentials missing: set AUDIT_E2E_EMAIL and AUDIT_E2E_PASSWORD in .env.local')
  }
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').waitFor({ state: 'visible' })
  await page.getByLabel('E-mail').fill(EMAIL!)
  await page.getByPlaceholder('Password').fill(PASSWORD!)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 60_000 })
}

/**
 * Resolve the active client/workspace name as rendered by the app.
 *
 * Client names in the seeded database change over time, so specs must NOT
 * hardcode them. The WorkspaceSwitcher trigger always exposes the active
 * client name through its accessible label
 * (`aria-label="Current workspace: <name>"`), which makes it the single
 * source of truth for E2E assertions.
 *
 * @returns the active client name, or null when it cannot be resolved.
 */
export async function getActiveClientName(page: Page): Promise<string | null> {
  const trigger = page.locator('[aria-label^="Current workspace:"]').first()
  if (!(await trigger.isVisible().catch(() => false))) return null
  const label = await trigger.getAttribute('aria-label')
  const name = label?.replace(/^Current workspace:\s*/i, '').trim()
  return name || null
}
