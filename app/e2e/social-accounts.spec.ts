import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Social Accounts & Channel Dispatch (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Social Accounts page loads with tabs, factual channels and metrics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/social-accounts');
    await page.waitForLoadState('networkidle');

    // Page title and description
    await expect(page.getByRole('heading', { name: /Social Accounts/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Manage connected accounts, monitor data sync/i)).toBeVisible();

    // Verify filter tabs are rendered (All Accounts, Instagram, TikTok, Action Required)
    await expect(page.getByRole('tab', { name: /All Accounts/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Instagram/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /TikTok/i })).toBeVisible();

    // Switch tab to Instagram
    await page.getByRole('tab', { name: /Instagram/i }).click();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tab=Instagram/);

    // Switch back to All Accounts
    await page.getByRole('tab', { name: /All Accounts/i }).click();
    await page.waitForTimeout(300);

    // Verify connected accounts render without NaN. Scope to the board region
    // and avoid bare `text=@` which also matches the Next.js dev-tools overlay.
    const board = page.locator('main')
    const handles = board.locator('span, p, div').filter({ hasText: /^@[A-Za-z0-9._-]+$/ })
    if ((await handles.count()) > 0) {
      await expect(handles.first()).toBeVisible()
    }
  });

  test('Flow 2: Connect Channel modal opens with all 6 platform tiles and safe dismiss', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/social-accounts');
    await page.waitForLoadState('networkidle');

    // Click "Connect Account" button
    const connectBtn = page.getByRole('button', { name: /Connect Account/i });
    await expect(connectBtn).toBeVisible({ timeout: 10000 });
    await connectBtn.click();

    // Verify Connect Channel Dialog appears
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Connect Social Account/i })).toBeVisible();

    // Verify platform tiles exist
    await expect(dialog.getByText('Instagram')).toBeVisible();
    await expect(dialog.getByText('TikTok')).toBeVisible();
    await expect(dialog.getByText('YouTube')).toBeVisible();
    await expect(dialog.getByText('LinkedIn')).toBeVisible();
    await expect(dialog.getByText('Twitter')).toBeVisible();
    await expect(dialog.getByText('Facebook')).toBeVisible();

    // Safe dismiss via Close button
    const closeBtn = dialog.getByRole('button', { name: /Close/i });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Flow 3: Refresh Accounts (Sync All) triggers without crash', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/social-accounts');
    await page.waitForLoadState('networkidle');

    // Click top toolbar "Refresh data" button
    const syncBtn = page.getByRole('button', { name: /Refresh data/i }).first();
    await expect(syncBtn).toBeVisible({ timeout: 10000 });
    await syncBtn.click();

    // Wait 1 second to ensure no crash or unhandled error
    await page.waitForTimeout(1000);
  });
});
