import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login';

test.describe('Content Calendar & Multi-Channel Dispatch (End-to-End QA)', () => {
  test.setTimeout(120000);

  test('Flow 1: Calendar loads with header, metric tickers, and factual monthly grid (no NaN)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // Main Page Title & Description
    await expect(page.getByRole('heading', { name: /Multi-Channel Dispatch Schedule/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Drag & drop posts across multi-channel publication schedule/i)).toBeVisible();

    // Metric Tickers
    await expect(page.getByText('Scheduled Flights')).toBeVisible();
    await expect(page.getByText('Slots Status Pipeline')).toBeVisible();
    await expect(page.getByText('Social Channels')).toBeVisible();

    // Ensure metrics contain no NaN
    const metricsStrip = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4');
    await expect(metricsStrip).toBeVisible();
    const metricsText = await metricsStrip.innerText();
    expect(metricsText).not.toContain('NaN');

    // Calendar view renders
    await expect(page.locator('[data-calendar]')).toHaveCount(1);
  });

  test('Flow 2: View Switcher (Month, Week, List) and platform filter pills', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // Switch to Week View
    const weekTab = page.getByRole('tab', { name: /Week View/i });
    await expect(weekTab).toBeVisible();
    await weekTab.click();
    await expect(weekTab).toHaveAttribute('data-state', 'active');

    // Switch to List / Gantt Timeline
    const listTab = page.getByRole('tab', { name: /List \/ Gantt Timeline/i });
    await expect(listTab).toBeVisible();
    await listTab.click();
    await expect(listTab).toHaveAttribute('data-state', 'active');

    // Switch back to Month View
    const monthTab = page.getByRole('tab', { name: /Month View/i });
    await monthTab.click();
    await expect(monthTab).toHaveAttribute('data-state', 'active');

    // Platform Filter Pills
    const allPill = page.getByRole('tab', { name: /All/i });
    await expect(allPill).toBeVisible();
    const igPill = page.getByRole('tab', { name: /instagram/i });
    if (await igPill.isVisible()) {
      await igPill.click();
      await expect(igPill).toHaveAttribute('data-state', 'active');
    }
  });

  test('Flow 3: Post Dialog modal creation, Editor/Live Preview split pane, and safe dismiss', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // Click Schedule New Dispatch button
    const scheduleBtn = page.getByRole('button', { name: /Schedule New Dispatch/i });
    await expect(scheduleBtn).toBeVisible({ timeout: 10000 });
    await scheduleBtn.click();

    // PostDialog modal opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByRole('heading', { name: /Jadwalkan Postingan Baru/i })).toBeVisible();

    // Editor button & Live Preview button toggle
    const editorBtn = dialog.getByRole('button', { name: /Editor/i });
    const previewBtn = dialog.getByRole('button', { name: /Live Preview/i });
    await expect(editorBtn).toBeVisible();
    await expect(previewBtn).toBeVisible();

    // Toggle to Live Preview
    await previewBtn.click();

    // Toggle back to Editor
    await editorBtn.click();

    // Input title & caption
    const titleInput = dialog.locator('#post-title');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E Calendar Post Test');

    // Safe dismiss via Batal button (triggers unsaved changes protection because title was filled)
    const batalBtn = dialog.getByRole('button', { name: /Batal/i });
    await batalBtn.click();

    // Confirm exit dialog is shown
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText(/Batalkan perubahan postingan/i)).toBeVisible();

    // Click "Tinggalkan Draf" to safely dismiss
    await confirmDialog.getByRole('button', { name: /Tinggalkan Draf/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Flow 4: AI Copilot actions in Header (Brainstorm Modal)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // Open AI Copilot dropdown
    const copilotBtn = page.getByRole('button', { name: /AI Copilot/i });
    await expect(copilotBtn).toBeVisible({ timeout: 10000 });
    await copilotBtn.click();

    // Click Brainstorm Ideas
    const brainstormItem = page.getByRole('menuitem', { name: /Brainstorm Ideas/i });
    await expect(brainstormItem).toBeVisible();
    await brainstormItem.click();

    // Verify AI Content Studio dialog opens
    const brainstormDialog = page.getByRole('dialog');
    await expect(brainstormDialog).toBeVisible({ timeout: 10000 });
    await expect(brainstormDialog.getByRole('heading', { name: /AI Content Studio/i })).toBeVisible();

    // Close Dialog via Radix close button or Escape
    const closeBtn = brainstormDialog.getByRole('button', { name: /Close/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(brainstormDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Flow 5: Caption character limits and counter enforcement for multi-platform dispatch', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/calendar');
    await page.waitForLoadState('networkidle');

    // Open post dialog
    const scheduleBtn = page.getByRole('button', { name: /Schedule New Dispatch/i });
    await expect(scheduleBtn).toBeVisible({ timeout: 15000 });
    await scheduleBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Locate the character counter
    const counter = dialog.locator('#post-content-count');
    await expect(counter).toBeVisible();

    // Verify counter initial format
    const initialText = await counter.innerText();
    expect(initialText).toMatch(/0\s*\/\s*[\d.]+/);

    // Enter caption in textarea
    const captionArea = dialog.locator('textarea#post-content');
    await captionArea.fill('Testing character counter in E2E dispatch.');
    await expect(counter).toContainText('42');

    // Close dialog safely
    const batalBtn = dialog.getByRole('button', { name: /Batal/i });
    await batalBtn.click();
    const confirmDialog = page.getByRole('alertdialog');
    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /Tinggalkan Draf/i }).click();
    }
  });
});
