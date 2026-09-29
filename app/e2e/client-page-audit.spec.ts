import { test, expect } from '@playwright/test'

// Audit halaman client spesifik: semua tab + error + screenshot
test.setTimeout(180_000)
test.use({ baseURL: 'http://localhost:3000' })

const EMAIL = process.env.AUDIT_E2E_EMAIL || 'test-user@frhm.dev'
const PASSWORD = process.env.AUDIT_E2E_PASSWORD || 'TestPass123!'
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'
const CLIENT_ID = 'e17251a3-195c-4fba-b44a-61a1ece4928d'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

test('audit client page: all tabs', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`) })

  await login(page)

  const resp = await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load', timeout: 60_000 })
  console.log('HTTP_STATUS:', resp?.status())
  await page.waitForTimeout(3000)

  // Detect client name / header
  const bodyText = await page.locator('body').innerText()
  console.log('PAGE_TEXT_HEAD:', JSON.stringify(bodyText.slice(0, 300)))

  // Audit each tab
  const tabs = ['Overview', 'Content', 'Deliverables', 'Skills', 'Settings']
  for (const tabName of tabs) {
    const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
    if (await tab.count() === 0) {
      console.log(`TAB_MISSING: ${tabName}`)
      continue
    }
    await tab.first().click()
    await page.waitForTimeout(2500)
    const text = await page.locator('body').innerText()
    console.log(`--- TAB ${tabName} ---`)
    console.log(`  len=${text.length}`)
    console.log(`  head=${JSON.stringify(text.slice(0, 200))}`)
    await page.screenshot({ path: `${OUT}/client_audit_tab_${tabName.toLowerCase()}.png`, fullPage: false })
  }

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 15)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 15)))
  console.log('FAILED_REQUESTS:', JSON.stringify(failedRequests.slice(0, 15)))

  expect(pageErrors, 'no uncaught page errors').toEqual([])
})
