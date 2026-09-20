import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Admin Deliverables UI', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/deliverables');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
  
  test('should redirect new deliverable to login', async ({ page }) => {
    await page.goto('/admin/deliverables/new');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});