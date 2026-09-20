import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const ADMIN_EMAIL = 'dheia.buleud@gmail.com';
const ADMIN_PASSWORD = 'Sum3dang';

test.describe('CampaignForm wiring', () => {
  test('fills and submits campaign form, DB row created', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL(/admin/, { timeout: 15000 });

    await page.goto('/admin/planning/new');
    await page.waitForLoadState('networkidle');

    // Wait for the client list to load
    await page.waitForTimeout(1500);

    // Select client (Radix select: click trigger by id, then option)
    await page.locator('#client').click();
    await page.getByRole('option', { name: 'Taraju' }).click();

    await page.getByLabel('Nama Kampanye').fill('Test Kampanye E2E');

    await page.locator('#type').click();
    await page.getByRole('option', { name: 'Kampanye' }).click();

    // Capture the POST
    const apiPromise = page.waitForResponse(
      (r) => r.url().includes('/campaigns') && r.request().method() === 'POST',
      { timeout: 20000 }
    );
    await page.getByRole('button', { name: /Simpan Kampanye/i }).click();
    const apiRes = await apiPromise;
    const body = await apiRes.text();
    console.log(`POST /campaigns -> ${apiRes.status()} ${body}`);

    expect([200, 201]).toContain(apiRes.status());
    const parsed = JSON.parse(body);
    expect(parsed.campaign?.name).toBe('Test Kampanye E2E');

    // Redirect to calendar
    await page.waitForURL(/admin\/calendar/, { timeout: 15000 });
    expect(page.url()).toContain('/admin/calendar');
  });
});
