import { test as setup, expect } from '@playwright/test'

// Log in once and save the session so page sweeps don't re-login each time.
const EMAIL = process.env.AUDIT_E2E_EMAIL
const PASSWORD = process.env.AUDIT_E2E_PASSWORD

setup('authenticate', async ({ page }) => {
  setup.skip(!EMAIL || !PASSWORD, 'creds not set')
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL!)
  await page.getByLabel('Password').fill(PASSWORD!)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/admin/, { timeout: 20000 })
  await page.context().storageState({ path: 'e2e/.auth/admin.json' })
  expect(true).toBe(true)
})
