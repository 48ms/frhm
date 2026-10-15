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
