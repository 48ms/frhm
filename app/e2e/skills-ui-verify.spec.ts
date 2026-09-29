import { test, expect } from '@playwright/test'

test.setTimeout(120_000)
test.use({ baseURL: 'http://localhost:3000' })

const EMAIL = process.env.AUDIT_E2E_EMAIL || 'test-user@frhm.dev'
const PASSWORD = process.env.AUDIT_E2E_PASSWORD || 'TestPass123!'
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'
const CLIENT_ID = '31f24530-344f-422f-94f5-f66640070d75'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

test('skills tab: a11y + empty state + design system', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await login(page)
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(3000)

  // Open the Settings tab (contains ClientSkills)
  await page.getByRole('tab', { name: /Settings/i }).click()
  await page.waitForTimeout(2500)

  // Audit: raw <input type=checkbox> vs design-system Checkbox role
  const audit = await page.evaluate(() => {
    const rawCheckboxes = document.querySelectorAll('input[type="checkbox"]').length
    const radixCheckboxes = document.querySelectorAll('[role="checkbox"], button[data-state]').length
    const emptySlots = document.querySelectorAll('[data-slot="empty"]').length
    // Status selects should have aria-label
    const selects = Array.from(document.querySelectorAll('[data-slot="select-trigger"]'))
    const selectsWithoutLabel = selects.filter((s) => !s.getAttribute('aria-label') && !s.getAttribute('aria-labelledby')).length
    return { rawCheckboxes, radixCheckboxes, emptySlots, selectCount: selects.length, selectsWithoutLabel }
  })
  console.log('SKILLS_AUDIT:', JSON.stringify(audit))

  // Enter "Pilih Banyak" (multi-select) mode — this is where Checkbox renders
  const multiBtn = page.getByRole('button', { name: /Pilih Banyak/i })
  if (await multiBtn.count() > 0) {
    await multiBtn.first().click()
    await page.waitForTimeout(1200)
    const selAudit = await page.evaluate(() => {
      const radix = document.querySelectorAll('[role="checkbox"]').length
      const raw = document.querySelectorAll('input[type="checkbox"]').length
      const labelled = Array.from(document.querySelectorAll('[role="checkbox"]'))
        .filter((c) => c.getAttribute('aria-label')).length
      return { radixCheckboxes: radix, rawCheckboxes: raw, labelledCheckboxes: labelled }
    })
    console.log('SELECT_MODE_AUDIT:', JSON.stringify(selAudit))
    await page.screenshot({ path: `${OUT}/skills_select_mode.png`, fullPage: false })
    console.log('SCREENSHOT_SELECT_MODE_SAVED')
  } else {
    console.log('SELECT_MODE_BUTTON_NOT_FOUND')
  }

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 10)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 10)))

  await page.screenshot({ path: `${OUT}/skills_settings_tab.png`, fullPage: false })
  console.log('SCREENSHOT_SAVED')

  expect(pageErrors, 'no uncaught page errors').toEqual([])
})
