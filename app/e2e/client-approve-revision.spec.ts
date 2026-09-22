import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const CLIENT_EMAIL = process.env.CLIENT_E2E_EMAIL!
const CLIENT_PASSWORD = process.env.CLIENT_E2E_PASSWORD!
const DID = process.env.ADMIN_ID ?? "68082013-5253-4d78-b5b6-9ddc14cbc66c";

test.describe('Client approve/revision → skill_outputs (real DB write)', () => {
  test('approve writes skill_outputs.status via real session', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(CLIENT_EMAIL);
    await page.getByLabel('Password').fill(CLIENT_PASSWORD);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL(/client/, { timeout: 15000 });

    const result = await page.evaluate(async (id) => {
      const r = await fetch(`/api/client/deliverables/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      return { status: r.status, body: await r.text() };
    }, DID);
    console.log(`approve: HTTP ${result.status} ${result.body}`);
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body).success).toBe(true);
  });
});
