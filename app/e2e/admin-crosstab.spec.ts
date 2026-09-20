import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const ADMIN_EMAIL = 'dheia.buleud@gmail.com';
const ADMIN_PASSWORD = 'Sum3dang';
const CLIENT_ID = '44b48931-a33e-470a-9f3e-9064ee46373f'; // Taraju

test('cross-tab: create expense -> ROI tab shows it without F5', async ({ page }) => {
  const posts: string[] = [];
  page.on('response', (r) => { if (r.request().method() === 'POST') posts.push(`${r.status()} ${r.url()}`); });

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL(/admin/, { timeout: 15000 });

  await page.goto(`/admin/clients/${CLIENT_ID}`);
  await page.waitForTimeout(2500);

  // Go to Budget Ledger tab, create expense
  await page.getByText('Budget Ledger', { exact: true }).click();
  await page.waitForTimeout(1500);

  // Record current expense count
  const beforeCount = await page.locator('text=/Belum ada pengeluaran|Riwayat Pengeluaran/').count();

  // Open expense modal
  const expBtn = page.getByRole('button', { name: /Catat Pengeluaran/i }).first();
  await expBtn.click();
  await page.waitForTimeout(800);

  // Fill expense: category=other (avoid KOL dropdown), amount, date, description
  await page.locator('#category').selectOption('other');
  await page.waitForTimeout(300);
  await page.locator('#amount').fill('250000');
  await page.locator('#description').fill('E2E cross-tab test');
  await page.getByRole('button', { name: /Simpan Pengeluaran/i }).click();
  await page.waitForTimeout(2500);

  console.log('POSTS:', JSON.stringify(posts));

  // Now switch to ROI tab — does the new expense appear WITHOUT F5?
  await page.getByText('ROI Dashboard', { exact: true }).click().catch(async () => {
    await page.getByText(/ROI/i).first().click();
  });
  await page.waitForTimeout(2500);

  // ROI shows "Total Pengeluaran" value
  const roiText = await page.locator('body').innerText();
  console.log('ROI HAS 250000:', roiText.includes('250.000') || roiText.includes('250000'));
  console.log('ROI HAS 5.250.000:', roiText.includes('5.250.000'));

  // Switch back to Budget Ledger — is the expense listed?
  await page.getByText('Budget Ledger', { exact: true }).click();
  await page.waitForTimeout(2000);
  const budgetText = await page.locator('body').innerText();
  console.log('BUDGET TAB HAS E2E TEXT:', budgetText.includes('E2E cross-tab test'));
});
