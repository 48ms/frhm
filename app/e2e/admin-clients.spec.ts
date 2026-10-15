import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Admin Clients UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/clients');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});