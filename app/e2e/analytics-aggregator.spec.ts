import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Multi-Account Analytics Aggregator & Social Insights (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Multi-Account Social Aggregator renders with platform filters and deep insights', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Page header & description
    await expect(page.getByRole('heading', { name: /Analytics & Performance/i })).toBeVisible({ timeout: 15000 });

    // Multi-Account Aggregator widget
    const aggregator = page.locator('[data-testid="multi-account-aggregator"]');
    await expect(aggregator).toBeVisible({ timeout: 15000 });
    await expect(aggregator.getByText('Multi-Account Social Aggregator')).toBeVisible();
    await expect(aggregator.getByText('Live Sync')).toBeVisible();

    // Quick metrics strip inside aggregator
    await expect(aggregator.getByText(/Akun Terhubung/i)).toBeVisible();
    await expect(aggregator.getByText(/Total Multi-Reach/i)).toBeVisible();
    await expect(aggregator.getByText(/Rata-rata ER Gabungan/i)).toBeVisible();

    // Instagram Deep Insights card
    await expect(aggregator.getByText('Instagram Deep Insights')).toBeVisible();
    await expect(aggregator.getByText('Meta Graph')).toBeVisible();
    await expect(aggregator.getByText(/Distribusi Format/i)).toBeVisible();
    await expect(aggregator.getByText(/Rata-rata Saves/i)).toBeVisible();

    // TikTok Viral Insights card
    await expect(aggregator.getByText('TikTok Viral Insights')).toBeVisible();
    await expect(aggregator.getByText('TikTok Business')).toBeVisible();
    await expect(aggregator.getByText(/Skor Potensi Viral/i)).toBeVisible();

    // Test platform filter switching
    const igTab = aggregator.getByRole('button', { name: /^Instagram/i });
    if (await igTab.isVisible()) {
      await igTab.click();
      await expect(page).toHaveURL(/platform=instagram/);
    }

    const ttTab = aggregator.getByRole('button', { name: /^TikTok/i });
    if (await ttTab.isVisible()) {
      await ttTab.click();
      await expect(page).toHaveURL(/platform=tiktok/);
    }

    const allTab = aggregator.getByRole('button', { name: /^Semua Akun/i });
    if (await allTab.isVisible()) {
      await allTab.click();
    }

    // Trigger Social Accounts Synchronization
    const syncBtn = aggregator.getByRole('button', { name: /Sinkronkan Akun/i });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // Expect toast notification
    await expect(page.getByText(/Sinkronisasi Akun Berhasil/i)).toBeVisible({ timeout: 15000 });
  });
});
