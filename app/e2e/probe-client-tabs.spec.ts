import { test } from '@playwright/test'

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

test('probe skills tab content', async ({ page }) => {
  await login(page)

  // Also capture the client list row for this client.
  await page.goto('/admin/clients', { waitUntil: 'load', timeout: 60_000 })
  await page.waitForTimeout(2500)
  const listText = await page.locator('body').innerText()
  const idx = listText.indexOf('B2B Shell')
  console.log('LIST_HAS_CLIENT:', idx >= 0)
  if (idx >= 0) console.log('LIST_ROW_SNIPPET:', JSON.stringify(listText.slice(idx, idx + 160)))

  const resp = await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load', timeout: 60_000 })
  console.log('HTTP_STATUS:', resp?.status())
  await page.waitForTimeout(3000)

  // Header
  const h1 = await page.locator('h1').first().innerText().catch(() => '(none)')
  console.log('CLIENT_H1:', JSON.stringify(h1))

  // Skills tab
  await page.getByRole('tab', { name: /Skills/i }).first().click()
  await page.waitForTimeout(3000)
  const main = await page.locator('main').innerText().catch(() => '')
  console.log('SKILLS_MAIN_LEN:', main.length)
  console.log('SKILLS_MAIN_TEXT:')
  console.log(main)

  // Settings tab
  await page.getByRole('tab', { name: /Settings/i }).first().click()
  await page.waitForTimeout(3000)
  const mainS = await page.locator('main').innerText().catch(() => '')
  console.log('SETTINGS_MAIN_LEN:', mainS.length)
  console.log('SETTINGS_MAIN_TEXT:')
  console.log(mainS)

  await page.screenshot({ path: `${OUT}/probe_skills_full.png`, fullPage: true })
})
