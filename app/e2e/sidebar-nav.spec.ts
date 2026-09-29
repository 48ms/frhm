import { test, expect } from '@playwright/test'

test.setTimeout(120_000)
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

test('sidebar: Client Workspace navigates to /admin/clients', async ({ page }) => {
  await login(page)

  // Start from a different page so we can prove navigation
  await page.goto('/admin/dashboard')
  await page.waitForTimeout(2000)

  // Click the sidebar "Client Workspace" parent item
  const sidebarLink = page.locator('a[href="/admin/clients"]').first()
  const count = await sidebarLink.count()
  console.log('SIDEBAR_LINK_COUNT:', count)

  if (count > 0) {
    await sidebarLink.click()
    await page.waitForURL(/\/admin\/clients$/, { timeout: 15000 })
    console.log('NAVIGATED_TO:', page.url())

    // Confirm the listing renders (not a detail page)
    const h1 = await page.locator('h1').first().textContent()
    console.log('H1:', h1)

    // Confirm the submenu auto-opens (client names visible)
    await page.waitForTimeout(1500)
    const subItems = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-slot="sidebar-menu-sub-button"], aside a[href^="/admin/clients/"]'))
        .map((e) => (e.textContent || '').trim())
        .filter(Boolean)
    )
    console.log('SUB_ITEMS_COUNT:', subItems.length)
    console.log('SUB_ITEMS_SAMPLE:', JSON.stringify(subItems.slice(0, 5)))

    await page.screenshot({ path: `${OUT}/sidebar_client_workspace_fixed.png`, fullPage: false })
  } else {
    console.log('SIDEBAR_LINK_NOT_FOUND — dumping sidebar anchors')
    const anchors = await page.evaluate(() =>
      Array.from(document.querySelectorAll('aside a, nav a')).map((a) => a.getAttribute('href'))
    )
    console.log('SIDEBAR_ANCHORS:', JSON.stringify(anchors.slice(0, 30)))
  }

  expect(count).toBeGreaterThan(0)
})
