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

  test('should open create client dialog directly from sidebar workspace switcher', async ({ page }) => {
    await loginAsAdmin(page);

    // Find and click the workspace switcher button in sidebar header
    const workspaceSwitcher = page.locator('.workspace-switcher-container button[data-slot="dropdown-menu-trigger"]');
    await expect(workspaceSwitcher).toBeVisible({ timeout: 15000 });
    await workspaceSwitcher.click();

    // The dropdown menu should show "Tambah Client Baru"
    const addClientItem = page.getByRole('menuitem', { name: /Tambah Client Baru/i });
    await expect(addClientItem).toBeVisible({ timeout: 5000 });

    // Click "Tambah Client Baru"
    await addClientItem.click();

    // Verify dialog opens — title shows "Langkah 1 dari 2"
    await expect(page.getByText(/Langkah.*dari.*2/)).toBeVisible({ timeout: 10000 });
  });

  test('should create new client from sidebar, auto-switch workspace, and show success launchpad', async ({ page }) => {
    await loginAsAdmin(page);

    const testBrandName = `AutoBrand ${Date.now().toString().slice(-4)}`;

    // Open from sidebar
    const workspaceSwitcher = page.locator('.workspace-switcher-container button[data-slot="dropdown-menu-trigger"]');
    await expect(workspaceSwitcher).toBeVisible({ timeout: 15000 });
    await workspaceSwitcher.click();

    const addClientItem = page.getByRole('menuitem', { name: /Tambah Client Baru/i });
    await expect(addClientItem).toBeVisible({ timeout: 5000 });
    await addClientItem.click();

    // Step 1: Fill name and select niche
    await page.getByLabel('Nama Brand').fill(testBrandName);
    await page.getByRole('combobox').click();
    await page.waitForTimeout(300);
    const firstOption = page.getByRole('option').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    await page.getByRole('button', { name: /Lanjut ke Kontak/i }).click();
    await expect(page.getByText(/Langkah 2 dari 2/i)).toBeVisible({ timeout: 10000 });

    // Step 2: Submit
    await page.getByRole('button', { name: /Siapkan Workspace/i }).click();

    // Success dialog launchpad
    await expect(page.getByText(/Workspace Client Siap!/i)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('strong.text-foreground', { hasText: testBrandName })).toBeVisible({ timeout: 5000 });

    // Click "Lanjut ke Dashboard Dulu"
    await page.getByRole('button', { name: /Lanjut ke Dashboard Dulu/i }).click();

    // Verify modal closed and sidebar now reflects the new workspace
    await expect(page.getByText(/Workspace Client Siap!/i)).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.workspace-switcher-container')).toContainText(testBrandName);
  });
});

