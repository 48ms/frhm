import { test, expect } from '@playwright/test'

test.setTimeout(120_000)
test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL!
const PASSWORD = process.env.AUDIT_E2E_PASSWORD!
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'
const CLIENT_ID = '31f24530-344f-422f-94f5-f66640070d75'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

test('mobile overflow + console + errors', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`) })

  await login(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(6000)

  const mobile = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
    tablistScrollW: document.querySelector('[role="tablist"]')?.scrollWidth ?? 0,
    tablistClientW: document.querySelector('[role="tablist"]')?.clientWidth ?? 0,
  }))
  console.log('MOBILE:', JSON.stringify(mobile))

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 15)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 15)))
  console.log('FAILED_REQUESTS:', JSON.stringify(failedRequests.slice(0, 20)))

  await page.screenshot({ path: `${OUT}/ws_audit_mobile_full.png`, fullPage: true })
})
