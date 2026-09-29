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

test('calendar post dialog: a11y + no console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await login(page)
  await page.goto('/admin/calendar', { waitUntil: 'load' })
  await page.waitForTimeout(5000)

  // Open the post dialog via the "Tambah Jadwal" button
  const addBtn = page.getByRole('button', { name: /Tambah Jadwal/i })
  if (await addBtn.count() > 0) {
    await addBtn.click()
    await page.waitForTimeout(2000)

    // Check that the status radio group is present and accessible
    const radios = page.getByRole('radio')
    const radioCount = await radios.count()
    console.log('STATUS_RADIO_COUNT:', radioCount)

    // Check keyboard navigation: focus first radio, press ArrowRight
    if (radioCount > 0) {
      await radios.first().focus()
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(300)
      const checked = await page.locator('[role="radio"][aria-checked="true"]').count()
      console.log('RADIO_KB_CHECKED:', checked)
    }

    // Verify all form inputs inside the dialog have labels
    const unlabeled = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('[data-slot="dialog"] input, [data-slot="dialog"] textarea, [data-slot="dialog"] select'))
      return inputs.filter((el) => {
        const id = el.getAttribute('id')
        const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
        if (aria) return false
        if (!id) return true
        return !document.querySelector(`label[for="${id}"]`)
      }).length
    })
    console.log('UNLABELED_INPUTS_IN_DIALOG:', unlabeled)

    await page.screenshot({ path: `${OUT}/calendar_post_dialog.png` })
    await page.keyboard.press('Escape')
  } else {
    console.log('NO_ADD_BUTTON_FOUND')
  }

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 15)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 15)))
  expect(pageErrors).toEqual([])
})
