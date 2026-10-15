import { test, expect } from '@playwright/test'

test.describe('Login form (auth/login)', () => {
  test('renders the login stage and shows validation on empty submit', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /log in/i })).toBeVisible()
    await expect(page.getByPlaceholder('E-mail').first()).toBeVisible()
    await expect(page.getByPlaceholder('Password').first()).toBeVisible()

    await page.getByRole('button', { name: /^log in$/i }).click()
    await expect(page.getByText(/contoh: nama@email\.com/i).first()).toBeVisible()
  })

  test('sign up tab switches via nuqs URL state', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByRole('tab', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/mode=signup/)
    await expect(page.getByPlaceholder('Full name')).toBeVisible()

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

  test('password visibility toggle changes input type and aria-pressed attribute', async ({ page }) => {
    await page.goto('/auth/login')

    const passwordInput = page.getByPlaceholder('Password').first()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = page.getByRole('button', { name: /show password/i })
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: /hide password/i })).toBeVisible()

    await page.getByRole('button', { name: /hide password/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('remember me checkbox toggles properly', async ({ page }) => {
    await page.goto('/auth/login')

    const rememberCheckbox = page.getByRole('checkbox', { name: /remember me/i })
    await expect(rememberCheckbox).toBeVisible()
    await expect(rememberCheckbox).toBeChecked()

    await rememberCheckbox.click()
    await expect(rememberCheckbox).not.toBeChecked()

    await rememberCheckbox.click()
    await expect(rememberCheckbox).toBeChecked()
  })

  test('invalid login credentials show user-friendly error notice', async ({ page }) => {
    await page.goto('/auth/login')
    // Wait for hydration before filling: filling before React hydrates causes
    // the controlled input to be reset to '' and the submit to fail validation.
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('E-mail').first().fill('random-unregistered@frhm.dev')
    await page.getByPlaceholder('Password').first().fill('WrongPassword123!')
    await page.getByRole('button', { name: /^log in$/i }).click()

    // Assert specifically on the auth failure banner message
    await expect(page.getByText(/Email atau password salah/i)).toBeVisible({ timeout: 15000 })
  })
})
