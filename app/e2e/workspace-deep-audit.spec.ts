import { test, expect } from '@playwright/test'

test.setTimeout(300_000)
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

test('client workspace deep audit', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`) })

  await login(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(5000)

  // ---------- TAB ROLES / ARIA ----------
  const tabA11y = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
    const tablist = document.querySelector('[role="tablist"]')
    return {
      tablistPresent: !!tablist,
      tablistLabel: tablist?.getAttribute('aria-label') ?? null,
      tabCount: tabs.length,
      tabsWithAriaSelected: tabs.filter((t) => t.hasAttribute('aria-selected')).length,
      tabsWithAriaControls: tabs.filter((t) => t.hasAttribute('aria-controls')).length,
      tabsWithTabIndex: tabs.map((t) => (t as HTMLElement).tabIndex),
      tabNames: tabs.map((t) => (t.textContent || '').trim()),
    }
  })
  console.log('TAB_A11Y:', JSON.stringify(tabA11y))

  // ---------- TABPANEL ARIA ----------
  const panelA11y = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'))
    return {
      count: panels.length,
      withLabelledBy: panels.filter((p) => p.hasAttribute('aria-labelledby')).length,
    }
  })
  console.log('PANEL_A11Y:', JSON.stringify(panelA11y))

  // ---------- TAP TARGETS ----------
  const tapTargets = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, a[href], [role="tab"], input[type="checkbox"], [role="button"]'))
    const small: { text: string; w: number; h: number }[] = []
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.height < 32 || r.width < 32) {
        small.push({ text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) })
      }
    }
    return { total: els.length, smallCount: small.length, samples: small.slice(0, 12) }
  })
  console.log('TAP_TARGETS:', JSON.stringify(tapTargets))

  // ---------- CONTRAST (tab triggers) ----------
  const contrast = await page.evaluate(() => {
    function lum(c: string) {
      const m = c.match(/\d+(\.\d+)?/g)
      if (!m) return null
      const [r, g, b] = m.slice(0, 3).map(Number).map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    function parseBg(el: Element): string | null {
      let cur: Element | null = el
      while (cur) {
        const bg = getComputedStyle(cur).backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg
        cur = cur.parentElement
      }
      return null
    }
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
    return tabs.map((t) => {
      const cs = getComputedStyle(t)
      const fg = cs.color
      const bg = parseBg(t) ?? 'rgb(255,255,255)'
      const l1 = lum(fg)
      const l2 = lum(bg)
      let ratio = null
      if (l1 != null && l2 != null) {
        const hi = Math.max(l1, l2)
        const lo = Math.min(l1, l2)
        ratio = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
      }
      return { name: (t.textContent || '').trim(), fg, bg, ratio }
    })
  })
  console.log('TAB_CONTRAST:', JSON.stringify(contrast))

  // ---------- FORM CONTROLS WITHOUT LABEL ----------
  const labelAudit = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
    const unlabeled: string[] = []
    for (const el of inputs) {
      const id = el.getAttribute('id')
      const hasLabel = (id && document.querySelector(`label[for="${id}"]`)) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('placeholder')
      if (!hasLabel) unlabeled.push(el.getAttribute('name') || el.getAttribute('type') || 'unknown')
    }
    return { total: inputs.length, unlabeledCount: unlabeled.length, samples: unlabeled.slice(0, 10) }
  })
  console.log('FORM_LABELS:', JSON.stringify(labelAudit))

  // ---------- REDUCED MOTION ----------
  const motion = await page.evaluate(() => {
    let count = 0
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el)
      if (cs.animationName !== 'none' || (cs.transitionDuration !== '0s' && cs.transitionDuration !== '')) count++
    }
    return count
  })
  console.log('ANIMATED_ELEMENTS:', motion)

  // ---------- PER-TAB: content presence + empty states + heights ----------
  const tabs = await page.locator('[role="tab"]').all()
  const tabNames = await Promise.all(tabs.map((t) => t.textContent()))
  console.log('TAB_NAMES:', JSON.stringify(tabNames.map((t) => (t || '').trim())))

  for (let i = 0; i < tabs.length; i++) {
    const name = (tabNames[i] || '').trim()
    await tabs[i].click()
    await page.waitForTimeout(2200)
    const info = await page.evaluate(() => {
      const panel = document.querySelector('[role="tabpanel"]')
      const text = (panel?.textContent || '').trim()
      return {
        panelTextLen: text.length,
        hasSkeleton: !!panel?.querySelector('[class*="animate-pulse"], [data-slot*="skeleton"]'),
        // crude empty-state detection
        emptyWords: /belum ada|tidak ada|kosong|empty/i.test(text),
        buttons: Array.from(panel?.querySelectorAll('button') ?? []).map((b) => (b.textContent || '').trim()).filter(Boolean).slice(0, 12),
        headings: Array.from(panel?.querySelectorAll('h1,h2,h3,h4') ?? []).map((h) => (h.textContent || '').trim()).slice(0, 8),
      }
    })
    console.log(`TAB[${name}]_INFO:`, JSON.stringify(info))
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await page.screenshot({ path: `${OUT}/wsdeep_${i}_${slug}.png`, fullPage: true })
  }

  // ---------- KEYBOARD NAV ----------
  const firstTab = page.locator('[role="tab"]').first()
  await firstTab.focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500)
  const afterArrow = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
    return { focused: (document.activeElement?.textContent || '').trim(), focusedIsTab: document.activeElement?.getAttribute('role') === 'tab', tabIndexes: tabs.map((t) => (t as HTMLElement).tabIndex) }
  })
  console.log('KEYBOARD_ARROW:', JSON.stringify(afterArrow))

  // ---------- FOCUS RING ----------
  const focusRing = await page.evaluate(() => {
    const el = document.querySelector('[role="tab"]') as HTMLElement | null
    if (!el) return null
    el.focus()
    const cs = getComputedStyle(el)
    return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, boxShadow: cs.boxShadow.slice(0, 80) }
  })
  console.log('FOCUS_RING:', JSON.stringify(focusRing))

  // ---------- MOBILE ----------
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/admin/clients/${CLIENT_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(3500)
  const mobile = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    bodyClientW: document.body.clientWidth,
    tablistScrollW: document.querySelector('[role="tablist"]')?.scrollWidth ?? 0,
    tablistClientW: document.querySelector('[role="tablist"]')?.clientWidth ?? 0,
  }))
  console.log('MOBILE:', JSON.stringify(mobile))
  await page.screenshot({ path: `${OUT}/wsdeep_mobile.png`, fullPage: true })

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 12)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 12)))
  console.log('FAILED_REQUESTS:', JSON.stringify(failedRequests.slice(0, 15)))

  expect(tabA11y.tabCount).toBeGreaterThan(0)
})
