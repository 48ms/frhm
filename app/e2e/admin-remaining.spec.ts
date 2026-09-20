import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Admin Calendar UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/calendar');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});

test.describe('Admin Users UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});

test.describe('Admin Settings UI', () => {
  test('should redirect AI settings to login', async ({ page }) => {
    await page.goto('/admin/settings/ai');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
  test('should redirect Bridge settings to login', async ({ page }) => {
    await page.goto('/admin/settings/bridge');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});