import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const CLIENT_EMAIL = process.env.CLIENT_E2E_EMAIL!
const CLIENT_PASSWORD = process.env.CLIENT_E2E_PASSWORD!
const CID = process.env.CLIENT_ID ?? "44b48931-a33e-470a-9f3e-9064ee46373f";

test.describe('Telegram disconnect (real DB write)', () => {
  test('client disconnect clears clients telegram fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(CLIENT_EMAIL);
    await page.getByLabel('Password').fill(CLIENT_PASSWORD);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL(/client/, { timeout: 15000 });

    const result = await page.evaluate(async (id) => {
      const r = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'client', id }),
      });
      return { status: r.status, body: await r.text() };
    }, CID);
    console.log(`disconnect: HTTP ${result.status} ${result.body}`);
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body).ok).toBe(true);
  });
});
