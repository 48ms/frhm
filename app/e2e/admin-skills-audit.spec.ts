import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Admin Skills UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/skills');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});

test.describe('Admin Audit UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});