import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Automated Schedule & Auto-Publish Engine (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Schedule Approved Deliverable directly from ERP Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/erp');
    await page.waitForLoadState('networkidle');

    // Deliverables section exists
    await expect(page.getByRole('heading', { name: /Daftar Deliverables & Dokumen Strategi/i })).toBeVisible({ timeout: 15000 });

    // The approved deliverable should show "Jadwalkan" button
    const scheduleBtn = page.getByRole('button', { name: /Jadwalkan/i }).first();
    await expect(scheduleBtn).toBeVisible({ timeout: 10000 });
    await scheduleBtn.click();

    // Verify Schedule Dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Jadwalkan Postingan ke Kalender/i })).toBeVisible();

    // Verify platform options exist (Instagram, TikTok, Twitter/X)
    const tiktokBtn = dialog.getByRole('button', { name: /TikTok/i });
    await expect(tiktokBtn).toBeVisible();
    await tiktokBtn.click();

    // Click a Golden Hour preset button
    const presetBtn = dialog.getByRole('button', { name: /Besok 10:00/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Submit scheduling
    const submitBtn = dialog.getByRole('button', { name: /Jadwalkan Sekarang/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect success toast
    await expect(page.getByText(/Postingan Berhasil Dijadwalkan!/i)).toBeVisible({ timeout: 10000 });

    // Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
