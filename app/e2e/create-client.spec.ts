import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.use({ baseURL: 'http://localhost:3000' });
test.setTimeout(120000);

test.describe('Create Client Quick Onboarding', () => {
  test('should open create client dialog from command palette', async ({ page }) => {
    await loginAsAdmin(page);

    // Trigger command palette
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');

    // Wait for command dialog — the "Aksi" group proves cmdk mounted
    await expect(page.getByRole('option', { name: 'Tambah Client Baru' })).toBeVisible({ timeout: 10000 });

    // Select "Tambah Client Baru"
    await page.getByRole('option', { name: 'Tambah Client Baru' }).click();

    // Verify dialog opens — title shows "Langkah 1 dari 2"
    await expect(page.getByText(/Langkah.*dari.*2/)).toBeVisible({ timeout: 10000 });
  });

  test('should validate brand name and niche required', async ({ page }) => {
    await loginAsAdmin(page);

    // Open command palette
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await page.getByRole('option', { name: 'Tambah Client Baru' }).click();
    await expect(page.getByText(/Langkah.*dari.*2/)).toBeVisible({ timeout: 10000 });

    // Click "Lanjut ke Kontak" without filling required fields
    await page.getByRole('button', { name: /Lanjut ke Kontak/i }).click();

    // Should show error banner
    await expect(page.getByText(/Mohon lengkapi Nama Brand dan Niche/i)).toBeVisible({ timeout: 10000 });
  });

  test('should complete step 1 with name and niche', async ({ page }) => {
    await loginAsAdmin(page);

    // Open command palette
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await page.getByRole('option', { name: 'Tambah Client Baru' }).click();
    await expect(page.getByText(/Langkah.*dari.*2/)).toBeVisible({ timeout: 10000 });

    // Fill Nama Brand
    await page.getByLabel('Nama Brand').fill('Brand Uji E2E');

    // Select Niche via Combobox
    await page.getByRole('combobox').click();
    await page.waitForTimeout(500);
    // Pick the first available niche option
    const firstOption = page.getByRole('option').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    // Click "Lanjut ke Kontak"
    await page.getByRole('button', { name: /Lanjut ke Kontak/i }).click();

    // Step 2 indicator must appear
    await expect(page.getByText(/Langkah 2 dari 2/i)).toBeVisible({ timeout: 10000 });
  });
});
