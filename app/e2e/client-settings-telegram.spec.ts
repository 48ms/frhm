import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const CLIENT_EMAIL = 'taraju.test.4fd43222@gmail.com';
const CLIENT_PASSWORD = 'TestPass123!';

test.describe('Client Settings - Telegram Toggle (real DB write)', () => {
  test('toggle sends PATCH and server returns ok:true', async ({ page }) => {
    // Login as client
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(CLIENT_EMAIL);
    await page.getByLabel('Password').fill(CLIENT_PASSWORD);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL(/client/, { timeout: 15000 });

    await page.goto('/client/settings');
    await page.waitForLoadState('networkidle');

    const toggle = page.getByRole('button', { name: /Nyalakan|Matikan/ });
    await expect(toggle).toBeVisible({ timeout: 10000 });

    // Start waiting for the response BEFORE clicking
    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/api/telegram/preferences'),
      { timeout: 15000 }
    );
    await toggle.click();
    const res = await respPromise;

    const status = res.status();
    const body = await res.text();
    console.log(`PATCH status=${status} body=${body}`);

    expect(status).toBe(200);
    const parsed = JSON.parse(body);
    expect(parsed.ok).toBe(true);
    expect(typeof parsed.enabled).toBe('boolean');
  });
});
