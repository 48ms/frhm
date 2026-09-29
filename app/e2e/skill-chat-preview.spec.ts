import { test, expect } from '@playwright/test'

// E2E: Skill Chat Live Draft Preview
// Verifikasi: draf live muncul selama interview; finalisasi hanya saat artefak final ada.
//
// Flow yang diuji (lihat workspace.tsx / skills.tsx / skill-chat.tsx):
//   /admin/clients/[id]?interview=brand-profile
//     -> page.tsx meneruskan initialSkill="brand-profile"
//     -> skills.tsx auto-open runner (openRunner) saat mount
//     -> SkillChat dialog: panel kiri interview, panel kanan live draft.

test.setTimeout(180_000)
test.use({ baseURL: 'http://localhost:3000' })

const EMAIL = process.env.AUDIT_E2E_EMAIL || 'test-user@frhm.dev'
const PASSWORD = process.env.AUDIT_E2E_PASSWORD || 'TestPass123!'
const OUT = 'C:/Users/bimam/.gemini/antigravity-ide/brain/94b62eed-a4d6-427a-afcb-17a12f351556/.tempmediaStorage'
const SKILL_ID = process.env.SKILL_CHAT_SKILL || 'brand-profile'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 })
}

async function resolveFirstClientId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/admin/clients', { waitUntil: 'load' })
  await page.waitForSelector('a[href*="/admin/clients/"]', { timeout: 30_000 })
  const href = await page.locator('a[href*="/admin/clients/"]').first().getAttribute('href')
  const m = href?.match(/\/admin\/clients\/([a-f0-9-]+)/)
  if (!m) throw new Error(`No client id in href: ${href}`)
  return m[1]
}

/** Buka dialog interview: coba auto-open via query param, fallback ke tombol "Jalankan →" di tab Skills. */
async function openInterview(page: import('@playwright/test').Page, clientId: string) {
  await page.goto(`/admin/clients/${clientId}?interview=${SKILL_ID}`, { waitUntil: 'load' })

  const dialogTitle = page.getByText('Interview Fondasi AI')
  try {
    await dialogTitle.waitFor({ state: 'visible', timeout: 15_000 })
    console.log('Interview auto-opened via ?interview= param')
    return
  } catch {
    console.log('Auto-open failed, falling back to Skills tab')
  }

  const skillsTab = page.getByRole('tab', { name: /Skills/i })
  await skillsTab.waitFor({ state: 'visible', timeout: 20_000 })
  await skillsTab.click()
  await page.waitForTimeout(2000)

  const runBtn = page.getByRole('button', { name: /Jalankan →/ }).first()
  await runBtn.waitFor({ state: 'visible', timeout: 15_000 })
  await runBtn.click()
  await dialogTitle.waitFor({ state: 'visible', timeout: 20_000 })
  console.log('Interview opened via Skills tab')
}

test('skill chat: live draft preview selama interview + gate finalisasi', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await login(page)
  const clientId = await resolveFirstClientId(page)
  console.log(`client id: ${clientId}`)

  await openInterview(page, clientId)
  await page.screenshot({ path: `${OUT}/skill_chat_dialog_open.png`, fullPage: false })

  // Panel kanan = container pratinjau. Panel kiri punya textarea + tombol kirim.
  const rightPanel = page.locator('.flex-1.overflow-y-auto').last()
  await rightPanel.waitFor({ state: 'visible', timeout: 15_000 })

  // Keadaan awal: harus "Menunggu Dokumen" (belum ada file/output/preview)
  const initialText = (await rightPanel.innerText()).trim()
  console.log('INITIAL_PANEL:', JSON.stringify(initialText.slice(0, 120)))
  await page.screenshot({ path: `${OUT}/skill_chat_initial.png`, fullPage: false })

  // Kirim 1 jawaban untuk memicu giliran AI
  const textarea = page.locator('textarea').first()
  await textarea.waitFor({ state: 'visible', timeout: 10_000 })
  await textarea.fill(
    'Halo! Kami brand skincare lokal, target pasar wanita 20-35 tahun di kota besar. Fokus jualan di Instagram dan TikTok.'
  )
  await textarea.press('Enter')
  console.log('sent turn 1, waiting for AI reply...')

  // Tunggu AI selesai mengetik (indikator "AI sedang mengetik..." hilang)
  await expect(page.getByText(/AI sedang mengetik/i)).toBeHidden({ timeout: 90_000 })

  const afterTurn1 = (await rightPanel.innerText()).trim()
  console.log('AFTER_TURN_1_LEN:', afterTurn1.length)

  const draftBadge = page.getByText('Draf Langsung')
  const hasDraftBadge = (await draftBadge.count()) > 0
  console.log('HAS_DRAFT_BADGE:', hasDraftBadge)
  await page.screenshot({ path: `${OUT}/skill_chat_after_turn1.png`, fullPage: false })

  // ASSERTION INTI: setelah 1 giliran, panel kanan TIDAK boleh kosong lagi
  // (harus "Draf Langsung" + isi, ATAU langsung final bila AI menganggap data cukup)
  const finalizeBtn = page.getByRole('button', { name: /Finalisasi & Simpan/i })
  const hasFinalize = (await finalizeBtn.count()) > 0

  expect(
    hasDraftBadge || hasFinalize,
    'panel kanan harus menunjukkan draf live atau artefak final setelah 1 giliran'
  ).toBeTruthy()

  if (hasDraftBadge) {
    // Draf live: TIDAK boleh ada tombol finalisasi
    expect(hasFinalize, 'tombol finalisasi tidak boleh ada saat masih draf').toBeFalsy()
    console.log('VERIFIED: draf live tampil tanpa tombol finalisasi')
  } else {
    console.log('VERIFIED: AI langsung menghasilkan artefak final (tombol finalisasi ada)')
    await page.screenshot({ path: `${OUT}/skill_chat_finalize_ready.png`, fullPage: false })
  }

  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors.slice(0, 10)))
  console.log('PAGE_ERRORS:', JSON.stringify(pageErrors.slice(0, 10)))

  expect(pageErrors, 'no uncaught page errors').toEqual([])
})
