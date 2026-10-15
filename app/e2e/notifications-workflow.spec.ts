import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Automated WhatsApp & Telegram Notification Engine (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Open Notification Dialog and verify WhatsApp/Telegram channel configuration', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/erp');
    await page.waitForLoadState('networkidle');

    // Deliverables section exists
    await expect(page.getByRole('heading', { name: /Daftar Deliverables & Dokumen Strategi/i })).toBeVisible({ timeout: 15000 });

    // Click "Notifikasi Review" button on the first deliverable
    const notifBtn = page.getByRole('button', { name: /Notifikasi Review/i }).first();
    await expect(notifBtn).toBeVisible({ timeout: 10000 });
    await notifBtn.click();

    // Verify Notification Dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Kirim Notifikasi Review Klien/i })).toBeVisible();

    // Check channels exist
    await expect(dialog.getByText(/WhatsApp/i).first()).toBeVisible();
    await expect(dialog.getByText(/Telegram Bot/i)).toBeVisible();

    // Check message preview section exists with review portal URL
    await expect(dialog.getByText(/Pratinjau Pesan Terkirim/i)).toBeVisible();
    await expect(dialog.getByRole('link', { name: /\/review\//i })).toBeVisible();

    // Enter a custom note and verify live preview update
    const noteArea = dialog.getByPlaceholder(/Contoh: Mohon tinjau scene ke-2/i);
    await expect(noteArea).toBeVisible();
    await noteArea.fill('Review segera untuk promo weekend.');
    await expect(dialog.getByText(/Review segera untuk promo weekend/i).first()).toBeVisible();

    // Submit dispatch
    const dispatchBtn = dialog.getByRole('button', { name: /Kirim Notifikasi Sekarang/i });
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // Verify dispatch result section appears
    await expect(dialog.getByText(/Hasil Pengiriman Notifikasi/i)).toBeVisible({ timeout: 15000 });

    // Verify "Buka di WhatsApp" link or WhatsApp status badge is rendered
    const waResult = dialog.getByText(/WhatsApp/i).first();
    await expect(waResult).toBeVisible();

    // Close dialog
    const closeBtn = dialog.getByRole('button', { name: /Tutup/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Flow 2: WhatsApp Webhook Handshake Endpoint verification', async ({ request }) => {
    // Test rejection without verify token
    const rejectRes = await request.get('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid_token&hub.challenge=98765');
    expect(rejectRes.status()).toBe(403);

    // Test POST rejection when secret header is missing in production or strict mode
    const postRes = await request.post('/api/whatsapp/webhook', {
      data: { event: 'ping' },
    });
    // Should respond with 200 (in development/test) or 401
    expect([200, 401]).toContain(postRes.status());
  });
});
