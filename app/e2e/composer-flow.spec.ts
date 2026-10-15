import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Content Composer & Multi-Platform Publishing (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Composer loads, displays 4 steps, and accepts Step 1 inputs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/composer');
    await page.waitForLoadState('networkidle');

    // Page title and description
    await expect(page.getByRole('heading', { name: /Content Composer/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Auto Posting Lebih Simpel/i)).toBeVisible();

    // Visual Stepper
    await expect(page.getByText('Tulis / Upload')).toBeVisible();
    await expect(page.getByText('Pilih Platform')).toBeVisible();
    await expect(page.getByText('Atur Jadwal')).toBeVisible();
    await expect(page.getByText('Publish')).toBeVisible();

    // Benefits sidebar
    await expect(page.getByText('Hemat Waktu Posting')).toBeVisible();
    await expect(page.getByText('Satu Dashboard')).toBeVisible();
    await expect(page.getByText('Auto Posting').last()).toBeVisible();

    // Step 1 input fields
    const titleInput = page.getByPlaceholder(/e\.g\. Campaign Natal 2026/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Peluncuran Menu Baru Frahma 2026');

    const captionInput = page.getByPlaceholder(/Tulis pesan brilian Anda di sini/i);
    await expect(captionInput).toBeVisible();
    await captionInput.fill('Sensasi rasa otentik yang siap memanjakan lidah Anda. Jangan lewatkan promo opening diskon 30% hari ini!');

    // Pre-Flight Audit button
    const auditBtn = page.getByRole('button', { name: /Audit Kepatuhan Platform/i });
    await expect(auditBtn).toBeVisible();
  });

  test('Flow 2: Step 2 platform selection and visual branching diagram', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/composer');
    await page.waitForLoadState('networkidle');

    // Fill Step 1
    await page.getByPlaceholder(/e\.g\. Campaign Natal 2026/i).fill('Promo Akhir Pekan');
    await page.getByPlaceholder(/Tulis pesan brilian Anda di sini/i).fill('Promo spesial weekend hanya di Pawon Sengon!');

    // Advance to Step 2
    const nextBtn = page.getByRole('button', { name: /Selanjutnya/i });
    await nextBtn.click();

    // Verify Step 2 heading & branching diagram
    await expect(page.getByText(/1 Konten, Banyak Platform/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Konten Anda/i)).toBeVisible();

    // Click Kembali to verify step reversal
    const backBtn = page.getByRole('button', { name: /Kembali/i });
    await backBtn.click();
    await expect(page.getByPlaceholder(/e\.g\. Campaign Natal 2026/i)).toBeVisible();
  });

  test('Flow 3: Full 4-step wizard progression to Step 4 publish review', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/composer');
    await page.waitForLoadState('networkidle');

    // Step 1: Input
    await page.getByPlaceholder(/e\.g\. Campaign Natal 2026/i).fill('Campaign Launch Q4');
    await page.getByPlaceholder(/Tulis pesan brilian Anda di sini/i).fill('Pengumuman penting untuk semua pelanggan setia kami.');
    await page.getByRole('button', { name: /Selanjutnya/i }).click();

    // Step 2: Platform
    await expect(page.getByText(/1 Konten, Banyak Platform/i)).toBeVisible({ timeout: 10000 });
    // Advance to Step 3
    await page.getByRole('button', { name: /Selanjutnya/i }).click();

    // Step 3: Schedule
    await expect(page.getByLabel(/Tanggal Tayang/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/Waktu Tayang/i)).toBeVisible();

    // Advance to Step 4
    await page.getByRole('button', { name: /Selanjutnya/i }).click();

    // Step 4: Ready to publish
    await expect(page.getByRole('heading', { name: /Siap Meluncur!/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Jadwalkan & Publish Otomatis/i })).toBeVisible();
  });
});
