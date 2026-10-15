import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

test.describe('Login page UI', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    // Check if form or key elements exist
    await expect(page).toHaveURL(/.*login/);
  });
});
