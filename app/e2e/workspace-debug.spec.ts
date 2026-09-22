import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3004' })

const EMAIL = process.env.AUDIT_E2E_EMAIL ?? 'test-user@frhm.dev'
const PASSWORD = process.env.AUDIT_E2E_PASSWORD ?? 'TestPass123!'

test('workspace debug', async ({ page }) => {
  const errors: string[] = []
  const logs: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`ERROR: ${m.text()}`)
    logs.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`))

  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 })
  console.log('LOGGED IN, url:', page.url())

  // Get client id
  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 15000 })
  const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
  const clientId = m?.[1]
  console.log('CLIENT_ID:', clientId)
  if (!clientId) throw new Error('No client id found')

  // Visit workspace
  const startTime = Date.now()
  await page.goto(`/admin/clients/${clientId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  console.log('NAVIGATED, elapsed:', Date.now() - startTime, 'ms, url:', page.url())

  // Wait for content
  await page.waitForTimeout(20000)
  console.log('WAITED 20s, url:', page.url())

  // Capture state
  const bodyText = await page.locator('body').innerText().catch(() => '') || ''
  console.log('BODY (first 1000):', bodyText.substring(0, 1000))

  const tabsCount = await page.locator('[value="setup"]').count()
  console.log('Tabs [value="setup"] count:', tabsCount)

  const hasError = bodyText.includes('Application error') || bodyText.includes('Something went wrong')
  console.log('Has error marker:', hasError)

  const content = await page.content()
  console.log('HTML length:', content.length)
  console.log('HTML (first 1500):', content.substring(0, 1500))

  if (errors.length) {
    console.log('CONSOLE ERRORS:')
    errors.forEach(e => console.log(' ', e))
  }
  if (logs.length > 5) {
    console.log('LOGS (last 10):')
    logs.slice(-10).forEach(l => console.log(' ', l))
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/workspace-debug.png', fullPage: true })
  console.log('SCREENSHOT SAVED')
})