import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Dashboard Overview & Parallel Routes (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Dashboard Overview loads with KPIs, Hero, and real factual metrics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Page title from PageContainer
    await expect(page.getByRole('heading', { name: /Dashboard Overview/i })).toBeVisible({ timeout: 15000 });

    // Hero Section Workspace badge
    await expect(page.getByText(/Workspace/i).first()).toBeVisible();

    // 4 Key Performance Indicators
    await expect(page.getByText('Total reach')).toBeVisible();
    await expect(page.getByText('Scheduled queue')).toBeVisible();
    await expect(page.getByText('Avg. engagement')).toBeVisible();
    await expect(page.getByText('Total engagement')).toBeVisible();

    // Ensure no NaN values rendered in KPI values
    const kpiSection = page.locator('section[aria-label="Key Performance Indicators"]');
    await expect(kpiSection).toBeVisible();
    const kpiText = await kpiSection.innerText();
    expect(kpiText).not.toContain('NaN');
  });

  test('Flow 2: Timeframe selector updates nuqs URL search parameter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Timeframe selector tabs
    const tab7d = page.getByRole('tab', { name: '7D' });
    const tab90d = page.getByRole('tab', { name: '90D' });

    await expect(tab7d).toBeVisible({ timeout: 10000 });
    await expect(tab90d).toBeVisible();

    // Click 7D and verify URL
    await tab7d.click();
    await expect(page).toHaveURL(/tf=7d/);

    // Click 90D and verify URL
    await tab90d.click();
    await expect(page).toHaveURL(/tf=90d/);
  });

  test('Flow 3: Connected Hub & AI Hook Studio modal integration', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Connected Hub heading
    await expect(page.getByRole('heading', { name: /Connected Hub/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/accounts connected/i)).toBeVisible();

    // Launch Studio AI button
    const launchAiBtn = page.getByRole('button', { name: /Launch Studio AI/i });
    await expect(launchAiBtn).toBeVisible();
    await launchAiBtn.click();

    // AI Hook Dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Studio AI Hook Generator/i })).toBeVisible();

    // Close Dialog via Radix close button or Escape
    const closeBtn = dialog.getByRole('button', { name: /Close/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
