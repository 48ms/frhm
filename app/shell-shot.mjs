import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/de1e860f-ea58-4e7c-9568-7f1b56530ca8/shell-check'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Suppress console noise from third-party.
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

  // Seed a fake Supabase session so the admin layout's auth guard passes.
  await page.addInitScript(() => {
    const now = Math.floor(Date.now() / 1000)
    const session = {
      access_token: 'x',
      refresh_token: 'x',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'bima@frhm.studio',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
      expires_at: now + 3600,
    }
    localStorage.setItem('sb-server-session', JSON.stringify(session))
  })

  // Login page first (no auth needed) to sanity-check fonts & style pipeline.
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}-login.png` })
  console.log('login shot OK')

  // Admin dashboard. The RLS/profile fetch will fail and redirect; instead we
  // capture whatever renders. If it redirects to login, we still get a shot.
  await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${OUT}-admin.png`, fullPage: false })
  console.log('admin shot OK, url =', page.url())

  // Full-page tall shot of the admin if we actually landed there.
  if (page.url().includes('/admin/dashboard')) {
    await page.setViewportSize({ width: 1440, height: 2400 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${OUT}-admin-tall.png`, fullPage: true })
    console.log('admin tall shot OK')
  }

  writeFileSync(`${OUT}-console.txt`, errors.join('\n') || '(no console errors)')
  console.log('console errors:', errors.length)
  await browser.close()
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
