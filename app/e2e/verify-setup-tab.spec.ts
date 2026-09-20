import { test, expect } from '@playwright/test';

test('ClientSetup renders in workspace + dead code absent', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3004/auth/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('dheia.buleud@gmail.com');
  await page.getByLabel('Password').fill('Sum3dang');
  await page.getByRole('button', { name: /masuk|login|sign in/i }).click();
  await page.waitForURL('**/admin/**', { timeout: 30000 });

  // Navigate to Taraju client workspace
  await page.goto('http://localhost:3004/admin/clients', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const tarajuLink = page.locator('a[href*="Taraju"]');
  if (await tarajuLink.count() > 0) {
    await tarajuLink.first().click();
  } else {
    // Fallback: first client link
    await page.locator('a[href*="/admin/clients/"]').first().click();
  }
  await page.waitForTimeout(2000);

  // Click Setup tab
  const setupTab = page.getByRole('tab', { name: /setup/i }).first();
  if (await setupTab.isVisible()) {
    await setupTab.click();
    await page.waitForTimeout(1000);
  }

  // ClientSetup UI must be present
  await expect(page.getByText('Brand Foundation & Setup')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Kelola profile brand, tone of voice')).toBeVisible({ timeout: 15000 });

  // At least one "Edit Brand Profile" button visible (in ClientSetup)
  const editBtns = page.getByRole('button', { name: 'Edit Brand Profile' });
  await expect(editBtns.first()).toBeVisible({ timeout: 10000 });
  const editBtnCount = await editBtns.count();
  expect(editBtnCount).toBeGreaterThanOrEqual(1);

  // Dead mock data MUST NOT be anywhere on the page
  const html = await page.content();
  expect(html).not.toContain('PO Restock 500 Unit Cushion');
  expect(html).not.toContain('Frahmadia Intelligence Pulse');
  expect(html).not.toContain('Nadia Cosmetic Lead');
  expect(html).not.toContain('Rp 350.000.000'); // dead mock total budget

  // Also verify no CommandCenterView in JS chunks (bundle test via network tab)
  const chunkFiles = await page.locator('script[src*=".js"]').all();
  let foundInChunk = false;
  for (const script of chunkFiles) {
    try {
      const src = await script.getAttribute('src');
      const res = await page.goto('http://localhost:3004' + src);
      const body = await res!.text();
      if (body.includes('CommandCenterView')) foundInChunk = true;
    } catch {}
  }
  expect(foundInChunk).toBe(false);
});
