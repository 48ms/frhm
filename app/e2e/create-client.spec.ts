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

  test('should load /admin/clients with server prefetching and trigger wizard from header action', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/clients');
    await page.waitForLoadState('networkidle');

    // Page title from PageContainer
    await expect(page.getByRole('heading', { name: /Client Workspaces/i })).toBeVisible({ timeout: 15000 });

    // Verify Header Action button "Tambah Client" is present in PageContainer
    const headerActionBtn = page.getByRole('button', { name: /Tambah Client/i });
    await expect(headerActionBtn).toBeVisible({ timeout: 10000 });

    // Verify Client Cards or dashed "Add New Client" card is rendered
    await expect(page.getByRole('button', { name: /Add New Client/i })).toBeVisible({ timeout: 10000 });

    // Click "Tambah Client" header action button
    await headerActionBtn.click();

    // Verify wizard dialog opens
    await expect(page.getByText(/Langkah.*dari.*2/)).toBeVisible({ timeout: 10000 });

    // Dismiss wizard dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Langkah.*dari.*2/)).not.toBeVisible({ timeout: 5000 });
  });

  test('should click Mulai Interview Brand Profile on success launchpad and auto-launch SkillInterviewModal in AI Studio', async ({ page }) => {
    await loginAsAdmin(page);

    const testBrandName = `InterviewBrand ${Date.now().toString().slice(-4)}`;

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

    // Click "Mulai Interview Brand Profile"
    await page.getByRole('button', { name: /Mulai Interview Brand Profile/i }).click();

    // Should navigate to /admin/ai?tab=brand-brain and auto-launch SkillInterviewModal
    await page.waitForURL('**/admin/ai**', { timeout: 15000 });

    const interviewDialog = page.getByRole('dialog');
    await expect(interviewDialog).toBeVisible({ timeout: 15000 });
    await expect(interviewDialog.getByText(/brand-profile/i).first()).toBeVisible({ timeout: 10000 });
    await expect(interviewDialog.getByRole('button', { name: /Eksekusi Seketika/i })).toBeVisible({ timeout: 10000 });

    // Dismiss dialog
    await page.keyboard.press('Escape');
    await expect(interviewDialog).not.toBeVisible({ timeout: 5000 });
  });
});


