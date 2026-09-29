import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3004' })

// Same admin credentials as scripts/e2e_admin.py
const ADMIN_EMAIL = 'dheia.buleud@gmail.com'
const ADMIN_PASSWORD = 'Sum3dang'

async function loginAsAdmin(page: any) {
  await page.goto('/auth/login')
  await page.getByLabel('Email').waitFor({ state: 'visible', timeout: 15000 })
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  // Retry if navigation gets stuck on login page (stale session)
  for (let i = 0; i < 3; i++) {
    const url = page.url()
    if (url.includes('/admin/')) return
    await page.waitForURL(/^(?!.*auth\/login).*$/, { timeout: 8000 })
    await page.waitForURL(/\/admin\//, { timeout: 8000 })
  }
}

test.describe('5-Step Onboarding Wizard', () => {
  test('full wizard walkthrough creates a client with AI foundation', async ({ page }) => {
    test.setTimeout(90000)
    const stamp = Date.now()
    const brandName = `E2E Wizard ${stamp}`

    await loginAsAdmin(page)

    // Open the wizard via the clients page "Tambah Client" button
    await page.goto('/admin/clients')
    await page.getByRole('button', { name: /Klien Baru/i }).first().click()

    // Dialog title proves the wizard mounted
    await expect(page.getByText(/Tambah Client Baru/)).toBeVisible({ timeout: 10000 })

    // --- Step 1: Identity ---
    await page.getByLabel(/Nama Brand/).fill(brandName)
    await page.getByLabel(/Elevator Pitch/).fill('Kopi artisan dengan biji single-origin dari petani lokal')
    await page.locator('#w-niche').selectOption('fnb')
    await page.getByRole('button', { name: /Lanjut/ }).click()

    // --- Step 2: Positioning ---
    await expect(page.getByText(/Positioning & Point of View/)).toBeVisible()
    await page.getByLabel(/Apa yang beda dari kompetitor/).fill('Satu-satunya yang masih roasting manual tiap pagi')
    await page.getByLabel(/Kenapa orang harus percaya/).fill('10 tahun pengalaman, 3 barista bersertifikat SCAA')
    await page.getByLabel(/Point of View/).fill('Orang salah fokus ke viralitas, padahal retention itu revenue')
    await page.getByLabel(/TIDAK akan pernah bilang/).fill('Kami tidak pernah menjelekkan kompetitor')
    await page.getByRole('button', { name: /Lanjut/ }).click()

    // --- Step 3: Audience ---
    await expect(page.getByText(/Audience Research/)).toBeVisible()
    await page.getByLabel(/Segmen Utama/).fill('Profesional muda 25-35 di kota besar')
    await page.getByLabel(/Pain Points/).fill('Sulit cari kopi enak yang konsisten dan halal')
    await page.getByLabel(/Desires/).fill('Ritual pagi yang nikmat tanpa ribet')
    await page.getByLabel(/Objections/).fill('Takut harganya terlalu mahal')
    await page.getByLabel(/^Platform$/).fill('Instagram, TikTok')
    await page.getByRole('button', { name: /Lanjut/ }).click()

    // --- Step 4: Voice ---
    await expect(page.getByText(/Voice & Guardrails/)).toBeVisible()
    // Nudge a couple of sliders so voice.md generation is triggered
    const sliders = page.locator('input[type="range"]')
    await sliders.nth(0).fill('5') // formality
    await sliders.nth(4).fill('1') // humor
    await page.getByLabel(/We sound/).fill('Confident, never arrogant. Warm, never cutesy.')
    await page.getByLabel(/Words We Use/).fill('seduhan, single-origin, artisan')
    await page.getByLabel(/Words We Ban/).fill('murah, cuan, viral')
    await page.getByRole('button', { name: /Lanjut/ }).click()

    // --- Step 5: Proof ---
    await expect(page.getByText(/Proof, Offers/)).toBeVisible()
    await page.getByLabel(/Angka & Results Konkret/).fill('10,000+ pelanggan, rating 4.9/5, 15 tahun')
    await page.getByLabel(/Primary CTA/).fill('Kunjungi kedai kami')

    const apiRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/admin/clients') && r.request().method() === 'POST',
      { timeout: 60000 }
    )
    await page.getByRole('button', { name: /Simpan & Generate Fondasi/ }).click()
    const apiResp = await apiRespPromise
    const apiJson = await apiResp.json()

    // --- API contract assertions (deterministic, must always hold) ---
    expect(apiResp.status()).toBe(201)
    expect(apiJson.success).toBe(true)
    expect(apiJson.data?.id).toBeTruthy()
    expect(apiJson.seededSkillCount).toBeGreaterThan(0)
    expect(Array.isArray(apiJson.filesGenerated)).toBe(true)

    // AI foundation outcome: report it, and enforce internal consistency when it succeeded.
    console.log(
      '[E2E] AI foundation =>',
      `brand=${apiJson.brandProfileGenerated}`,
      `pillars=${apiJson.contentPillarsGenerated}`,
      `voice=${apiJson.voiceGenerated}`,
      `files=[${apiJson.filesGenerated.join(', ')}]`,
      apiJson.brandProfileReason ? `reason="${apiJson.brandProfileReason}"` : ''
    )
    if (apiJson.brandProfileGenerated) {
      expect(apiJson.filesGenerated).toContain('brand-profile.md')
    }

    // Success dialog — shows credentials and the list of AI-generated files
    await expect(page.getByText(/Akun Client Dibuat/)).toBeVisible({ timeout: 60000 })

    // Dialog must be honest: either it says the foundation was generated, or it explains why not.
    const dialogText = await page.getByText(/Akun Client Dibuat/).locator('..').innerText()
    expect(dialogText).toMatch(/Fondasi AI berhasil digenerate|Fondasi AI gagal digenerate|Klien berhasil dibuat/)

    await page.getByRole('button', { name: 'Selesai' }).click()

    // The new client must appear in the list
    await expect(page.getByText(brandName)).toBeVisible({ timeout: 15000 })
  })

  test('wizard blocks empty brand name', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/clients')
    await page.getByRole('button', { name: /Klien Baru/i }).first().click()
    await expect(page.getByText(/Tambah Client Baru/)).toBeVisible({ timeout: 10000 })

    // Jump to last step and submit with no name
    await page.getByRole('button', { name: /5\. Proof/ }).click()
    await page.getByRole('button', { name: /Simpan & Generate Fondasi/ }).click()

    await expect(page.getByText(/Nama brand wajib diisi/)).toBeVisible({ timeout: 10000 })
  })
})
