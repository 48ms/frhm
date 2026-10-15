import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Branded Executive PDF Export Studio (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Export PDF Studio in Admin ERP Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/erp?clientId=5044af9e-0af1-4ec6-83ba-dacba4cfebf2');
    await page.waitForLoadState('networkidle');

    // Deliverables section exists
    await expect(page.getByRole('heading', { name: /Daftar Deliverables & Dokumen Strategi/i })).toBeVisible({ timeout: 15000 });

    // Look for PDF button on deliverable card
    const pdfBtn = page.getByRole('button', { name: /PDF/i }).first();
    await expect(pdfBtn).toBeVisible({ timeout: 10000 });
    await pdfBtn.click();

    // Verify Executive PDF Export dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Ekspor PDF Eksekutif/i })).toBeVisible();

    // Verify document identity & stats are displayed
    await expect(dialog.getByText(/Klien:/i)).toBeVisible();
    await expect(dialog.getByText(/Karakter/i)).toBeVisible();
    await expect(dialog.getByText(/Kata/i)).toBeVisible();

    // Verify Theme options are rendered
    await expect(dialog.getByText(/Cobalt Blue/i)).toBeVisible();
    await expect(dialog.getByText(/Emerald Growth/i)).toBeVisible();
    await expect(dialog.getByText(/Royal Indigo/i)).toBeVisible();
    await expect(dialog.getByText(/Monochrome/i)).toBeVisible();

    // Switch theme to Emerald Growth
    await dialog.getByText(/Emerald Growth/i).click();

    // Verify toggles
    await expect(dialog.getByText(/Lembar Tanda Tangan & Persetujuan/i)).toBeVisible();

    // Check preview button exists
    const previewBtn = dialog.getByRole('button', { name: /Pratinjau/i });
    await expect(previewBtn).toBeVisible();

    // Close dialog
    const batalBtn = dialog.getByRole('button', { name: /Batal/i });
    await batalBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Flow 2: Export PDF Studio in Client Review Portal', async ({ page, context }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/erp?clientId=5044af9e-0af1-4ec6-83ba-dacba4cfebf2');
    await page.waitForLoadState('networkidle');

    // Get live link to client review portal
    const reviewLink = page.locator('a[href^="/review/"]').first();
    await expect(reviewLink).toBeVisible({ timeout: 10000 });
    const reviewHref = await reviewLink.getAttribute('href');
    expect(reviewHref).toBeTruthy();

    // Open review portal in client context
    const clientPage = await context.newPage();
    await clientPage.goto(reviewHref!);
    await clientPage.waitForLoadState('networkidle');

    // Verify "Ekspor PDF" button in top nav
    const exportPdfNavBtn = clientPage.getByRole('button', { name: /Ekspor PDF/i });
    await expect(exportPdfNavBtn).toBeVisible({ timeout: 10000 });
    await exportPdfNavBtn.click();

    // Verify dialog opens in client portal
    const dialog = clientPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Ekspor PDF Eksekutif/i })).toBeVisible();

    // Switch to Royal Indigo theme
    await dialog.getByText(/Royal Indigo/i).click();

    // Dismiss dialog
    const batalBtn = dialog.getByRole('button', { name: /Batal/i });
    await batalBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    await clientPage.close();
  });
});
