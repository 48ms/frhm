import { test, expect } from '@playwright/test'

test('diagnose: opacity transition + nested button + click reliability', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })

  await page.goto('/preview-social-accounts')
  await page.waitForLoadState('networkidle')

  // Nested button check across whole page
  const nested = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const bad: string[] = []
    for (const b of btns) {
      if (b.querySelector('button')) bad.push((b.textContent || '').trim().slice(0, 40))
    }
    return bad
  })

  await page.getByRole('button', { name: /connect channel/i }).first().click()
  await page.getByRole('button', { name: /^Continue$/ }).click()

  const authBtn = page.getByRole('button', { name: /Authorize & Link/i })
  const readOpacity = () => authBtn.evaluate((el) => getComputedStyle(el as HTMLElement).opacity)

  const empty = { disabled: await authBtn.isDisabled(), opacity: await readOpacity() }

  await page.getByPlaceholder('@username').fill('@taraju.official')
  await page.waitForTimeout(600) // let transition settle
  const filled = { disabled: await authBtn.isDisabled(), opacity: await readOpacity() }

  // Try clicking and see if the step changes
  await authBtn.click({ timeout: 3000 }).catch((e) => errors.push('CLICK FAIL: ' + e.message.slice(0, 80)))
  await page.waitForTimeout(300)
  const authorizingShown = await page.getByText(/Opening secure OAuth|Channel linked/i).first().isVisible().catch(() => false)

  console.log('DIAG ' + JSON.stringify({ nestedButtons: nested, empty, filled, authorizingShown, errors }, null, 2))
})
