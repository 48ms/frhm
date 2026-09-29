import { test, expect } from '@playwright/test'

test.setTimeout(180_000)
test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL!
const PASSWORD = process.env.AUDIT_E2E_PASSWORD!
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

test('admin clients list UI/UX audit', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await login(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/clients', { waitUntil: 'load' })
  await page.waitForTimeout(4000)

  const header = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim()
    const desc = document.querySelector('p')?.textContent?.trim()
    const buttons = Array.from(document.querySelectorAll('button, a'))
      .map((b) => (b.textContent || '').trim())
      .filter(Boolean)
    return { h1, desc, buttons: buttons.slice(0, 20) }
  })
  console.log('HEADER:', JSON.stringify(header))

  const overflow = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
  }))
  console.log('OVERFLOW_DESKTOP:', JSON.stringify(overflow))

  const table = await page.evaluate(() => ({
    rows: document.querySelectorAll('tbody tr').length,
    headers: Array.from(document.querySelectorAll('thead th')).map((th) => (th.textContent || '').trim()),
    emptyState: !!document.body.textContent?.includes('Belum ada klien terdaftar'),
  }))
  console.log('TABLE:', JSON.stringify(table))

  // search input
  const searchVisible = await page.getByPlaceholder(/Cari nama atau email/i).isVisible().catch(() => false)
  console.log('SEARCH_VISIBLE:', searchVisible)

  // filter chips
  const chips = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter((t) => /Semua|Menunggu|Siap/.test(t))
  )
  console.log('FILTER_CHIPS:', JSON.stringify(chips))

  // view switcher
  const viewSwitcher = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[title]')).map((b) => b.getAttribute('title'))
  )
  console.log('VIEW_SWITCHER_TITLES:', JSON.stringify(viewSwitcher))

  await page.screenshot({ path: `${OUT}/clients_desktop_table.png`, fullPage: true })

  // grid view
  const gridBtn = page.locator('button[title="Tampilan Kartu"]')
  if (await gridBtn.count() > 0) {
    await gridBtn.click()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${OUT}/clients_desktop_grid.png`, fullPage: true })
  }
  const search = page.getByPlaceholder(/Cari nama atau email/i)
  if (await search.count() > 0) {
    await search.fill('zzzznonexistentzzz')
    await page.waitForTimeout(1200)
    const emptyAfterSearch = await page.evaluate(() => ({
      hasEmptyCopy: !!document.body.textContent?.includes('Tidak ada klien yang cocok'),
      hasResetButton: Array.from(document.querySelectorAll('button')).some((b) => (b.textContent || '').includes('Reset Filter')),
    }))
    console.log('SEARCH_EMPTY_STATE:', JSON.stringify(emptyAfterSearch))
    await page.screenshot({ path: `${OUT}/clients_search_empty.png`, fullPage: true })
    await search.fill('')
    await page.waitForTimeout(800)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/clients', { waitUntil: 'load' })
  await page.waitForTimeout(3000)
  const mobileOverflow = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
  }))
  console.log('OVERFLOW_MOBILE:', JSON.stringify(mobileOverflow))
  await page.screenshot({ path: `${OUT}/clients_mobile.png`, fullPage: true })

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 10)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 10)))

  expect(header.h1).toBeTruthy()
})
