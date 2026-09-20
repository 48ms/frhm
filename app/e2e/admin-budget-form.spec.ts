import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const ADMIN_EMAIL = 'dheia.buleud@gmail.com';
const ADMIN_PASSWORD = 'Sum3dang';
const CLIENT_ID = '44b48931-a33e-470a-9f3e-9064ee46373f'; // Taraju

test('budget form modal submits to DB', async ({ page }) => {
  page.on('response', (r) => {
    if (r.request().method() === 'POST' && r.url().includes('/budgets')) {
      console.log('POST budgets ->', r.status());
    }
  });

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL(/admin/, { timeout: 15000 });

  await page.goto(`/admin/clients/${CLIENT_ID}`);
  await page.waitForTimeout(2500);

  // Click Budget Ledger tab
  await page.getByText('Budget Ledger', { exact: true }).click();
  await page.waitForTimeout(1500);

  // Find the add button
  console.log('BUTTONS after tab click:', JSON.stringify(await page.getByRole('button').allTextContents().then(b => b.filter(x => /Tambah|Set|Budget/i.test(x)))));

  const addBtn = page.getByRole('button', { name: /Set Budget/i }).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForTimeout(600);

  // Fill form
  await page.locator('#month').fill('2026-09');
  await page.locator('#total_budget').fill('5000000');

  // Submit
  await page.getByRole('button', { name: /Simpan/i }).click();
  await page.waitForTimeout(3000);

  const err = await page.locator('.text-red-500').allTextContents();
  console.log('ERRORS:', JSON.stringify(err));
  console.log('TOAST:', await page.getByText(/berhasil|Berhasil/i).first().textContent().catch(() => 'none'));
});
