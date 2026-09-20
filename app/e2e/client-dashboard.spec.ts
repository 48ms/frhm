import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Client Dashboard UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page).toHaveURL(/.*auth.*login.*client.*dashboard/);
  });
});