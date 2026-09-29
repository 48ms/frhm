import { test, expect } from '@playwright/test'

test.setTimeout(180_000)
test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL!
const PASSWORD = process.env.AUDIT_E2E_PASSWORD!
const CLIENT_ID = '31f24530-344f-422f-94f5-f66640070d75'
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'

test('client workspace UI/UX audit', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // ---- login ----
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })

  // ---- desktop ----
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(4000)

  const tabs = await page.getByRole('tab').allInnerTexts()
  console.log('TABS:', JSON.stringify(tabs))

  // header / CTA presence
  const headerInfo = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim()
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'))
      .map((b) => (b.textContent || '').trim())
      .filter(Boolean)
    return { h1, buttons: buttons.slice(0, 25) }
  })
  console.log('HEADER:', JSON.stringify(headerInfo))

  // find visible overflow problems on the page (horizontal scroll of body)
  const overflow = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
  }))
  console.log('OVERFLOW:', JSON.stringify(overflow))

  // accessibility-ish: count elements with no accessible name (buttons/links)
  const a11y = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, a'))
    const unnamed = els.filter((e) => {
      const t = (e.textContent || '').trim()
      const aria = e.getAttribute('aria-label') || e.getAttribute('title')
      return !t && !aria
    })
    return { total: els.length, unnamed: unnamed.length, samples: unnamed.slice(0, 8).map((e) => e.outerHTML.slice(0, 120)) }
  })
  console.log('A11Y_UNNAMED:', JSON.stringify(a11y))

  await page.screenshot({ path: `${OUT}/ws_desktop_setup.png`, fullPage: true })

  // tab-by-tab capture (desktop)
  for (const name of ['Radar', 'Produksi', 'Marketing', 'Insight', 'Output']) {
    const t = page.getByRole('tab', { name })
    if (await t.count() === 0) { console.log('TAB_MISSING:', name); continue }
    await t.click()
    await page.waitForTimeout(2500)
    const h = await page.evaluate(() => document.body.scrollHeight)
    console.log(`TAB_${name.toUpperCase()}_height:`, h)
    await page.screenshot({ path: `${OUT}/ws_desktop_${name.toLowerCase()}.png`, fullPage: true })
  }

  // ---- mobile ----
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const mobileOverflow = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
  }))
  console.log('MOBILE_OVERFLOW:', JSON.stringify(mobileOverflow))
  await page.screenshot({ path: `${OUT}/ws_mobile_setup.png`, fullPage: true })

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 10)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 10)))

  expect(tabs.length).toBeGreaterThan(0)
})
