import { test, expect } from '@playwright/test'

test.describe('Login form (auth/login)', () => {
  test('renders the login stage and shows validation on empty submit', async ({ page }) => {
    await page.goto('/auth/login')

    // Heading login-stage muncul
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

    // Tab LOG IN aktif secara default
    await expect(page.getByRole('tab', { name: /log in/i })).toBeVisible()
    await expect(page.getByPlaceholder('E-mail').first()).toBeVisible()
    await expect(page.getByPlaceholder('Password').first()).toBeVisible()

    // Submit kosong -> pesan validasi email muncul (form tidak pindah halaman)
    await page.getByRole('button', { name: /^log in$/i }).click()
    await expect(page.getByText(/contoh: nama@email\.com/i).first()).toBeVisible()
  })

  test('sign up tab switches via nuqs URL state', async ({ page }) => {
    await page.goto('/auth/login')

    // Klik tab SIGN UP -> nuqs tulis ?mode=signup
    await page.getByRole('tab', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/mode=signup/)

    // Field "Full name" hanya ada di tab signup
    await expect(page.getByPlaceholder('Full name')).toBeVisible()

    // Kembali ke LOG IN -> nuqs menghapus param default (mode=login)
    await page.getByRole('tab', { name: /log in/i }).click()
    await expect(page).not.toHaveURL(/mode=signup/)
  })

  test('password too short shows minimum-length validation', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByPlaceholder('E-mail').first().fill('test-user@frhm.dev')
    await page.getByPlaceholder('Password').first().fill('123')
    await page.getByRole('button', { name: /^log in$/i }).click()

    await expect(page.getByText(/minimal 6 karakter/i).first()).toBeVisible()
  })
})
