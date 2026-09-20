import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3004' });

const ADMIN_EMAIL = 'dheia.buleud@gmail.com';
const ADMIN_PASSWORD = 'Sum3dang';
const CLIENT_ID = '44b48931-a33e-470a-9f3e-9064ee46373f';

test('platform-posts route writes to DB', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL(/admin/, { timeout: 15000 });

  // Call the new route through the authenticated browser context (shares cookies)
  const res = await page.request.post('/api/admin/platform-posts', {
    data: {
      client_id: CLIENT_ID,
      platform: 'Instagram',
      format: 'Reel',
      visual_hook: 'E2E hook',
      body_content: 'E2E body content',
      call_to_action: 'E2E CTA',
    },
  });
  console.log('ROUTE STATUS:', res.status());
  console.log('ROUTE BODY:', await res.text());
});
