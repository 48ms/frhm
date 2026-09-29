import { test, expect } from '@playwright/test'

test.setTimeout(120_000)
test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL!
const PASSWORD = process.env.AUDIT_E2E_PASSWORD!
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'

test('production page cycle2 (empty state + locale + scroll)', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // Login
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60000 })

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/production', { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  // Kanban: expect either 6 columns OR the empty state
  const emptyStateKanban = await page.locator('[data-slot="empty"]').count()
  const cardCount = await page.locator('.cursor-grab').count()
  console.log('KANBAN_EMPTY_STATE:', emptyStateKanban, 'CARDS:', cardCount)
  await page.screenshot({ path: `${OUT}/prod_cycle2_desktop_kanban.png`, fullPage: true })

  // Calendar: switch tab, expect empty state or Indonesian chrome
  await page.getByRole('tab', { name: 'Calendar' }).click()
  await page.waitForTimeout(1500)
  const emptyStateCal = await page.locator('[data-slot="empty"]').count()
  const calToolbarToday = await page.locator('text=Hari Ini').count()
  console.log('CAL_EMPTY_STATE:', emptyStateCal, 'CAL_INDO_TOOLBAR:', calToolbarToday)
  await page.screenshot({ path: `${OUT}/prod_cycle2_desktop_calendar.png`, fullPage: true })

  // Mobile kanban — columns should be horizontally scrollable (overflow-x-auto on wrapper)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Kanban Board' }).click()
  await page.waitForTimeout(1500)
  const hasOverflow = await page.evaluate(() => {
    const el = document.querySelector('.overflow-x-auto')
    if (!el) return { found: false }
    return { found: true, scrollW: el.scrollWidth, clientW: el.clientWidth, canScroll: el.scrollWidth > el.clientWidth }
  })
  console.log('MOBILE_OVERFLOW_AFFORDANCE:', JSON.stringify(hasOverflow))
  await page.screenshot({ path: `${OUT}/prod_cycle2_mobile_kanban.png`, fullPage: true })

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors))

  // Hard assertion: empty state OR cards — one of them must be present
  expect(emptyStateKanban + cardCount).toBeGreaterThan(0)
})
