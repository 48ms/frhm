import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.setTimeout(180_000)

const EMAIL = process.env.AUDIT_E2E_EMAIL || 'test-user@frhm.dev'
const PASSWORD = process.env.AUDIT_E2E_PASSWORD || 'TestPass123!'
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots')

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
})

test('Full Admin Login and Client Portal Walkthrough with Screenshots', async ({ page }) => {
  console.log('[Step 1] Membuka halaman login /auth/login...')
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png'), fullPage: true })

  console.log('[Step 2] Mengisi kredensial Admin...')
  const emailInput = page.getByLabel('E-mail')
  await emailInput.waitFor({ state: 'visible' })
  await emailInput.fill(EMAIL)

  const passwordInput = page.getByPlaceholder('Password')
  await passwordInput.fill(PASSWORD)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_credentials_filled.png') })

  console.log('[Step 3] Menekan tombol Log in dan menunggu redirect ke /admin/dashboard...')
  const loginBtn = page.getByRole('button', { name: /Log in|Sign in/i })
  await loginBtn.click()

  // Tunggu Admin layout & sidebar utama
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 60_000 })
  await page.waitForLoadState('networkidle')
  console.log('[Step 4] Berhasil masuk ke Admin Dashboard!')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_admin_dashboard.png'), fullPage: true })

  // Verifikasi URL berada di /admin/*
  expect(page.url()).toContain('/admin')

  console.log('[Step 5] Membuka manajemen klien (/admin/clients)...')
  await page.goto('/admin/clients')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_admin_clients_page.png'), fullPage: true })

  console.log('[Step 6] Menguji dialog [ Akses Klien ]...')
  const aksesBtn = page.getByRole('button', { name: /Akses Klien/i }).first()
  await expect(aksesBtn).toBeVisible({ timeout: 15_000 })
  await aksesBtn.click()

  // Tunggu modal dialog Akses Klien terbuka
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/Akses Portal Klien/i)).toBeVisible()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_client_access_modal.png') })

  // Tutup modal
  const closeBtn = page.getByRole('button', { name: /Tutup/i })
  await closeBtn.click()
  await expect(dialog).not.toBeVisible({ timeout: 10_000 })

  console.log('[Step 7] Menguji navigasi ke Dedicated Client Portal (/client/dashboard)...')
  await page.goto('/client/dashboard')
  await page.waitForLoadState('networkidle')

  const clientNav = page.locator('nav[aria-label="Client Navigation"]')
  await expect(clientNav).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_client_dashboard.png'), fullPage: true })

  console.log('[Step 8] Membuka Deliverables Review Hub (/client/review)...')
  await clientNav.locator('a[href^="/client/review"]').click()
  await page.waitForURL(/\/client\/review/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_client_review_hub.png'), fullPage: true })

  console.log('[Step 9] Membuka Agency Support Hotline (/client/support)...')
  await clientNav.locator('a[href^="/client/support"]').click()
  await page.waitForURL(/\/client\/support/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_client_support.png'), fullPage: true })

  console.log('[Step 10] Seluruh uji coba full login admin hingga portal klien sukses 100%!')
})
