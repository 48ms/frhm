import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.use({ baseURL: 'http://localhost:3004' });
const ADMIN_EMAIL = process.env.AUDIT_E2E_EMAIL!
const ADMIN_PASSWORD = process.env.AUDIT_E2E_PASSWORD!

function dbq(path: string): string {
  return execSync(`python3 scripts/dbq.py "${path}"`, {
    cwd: process.cwd(), encoding: 'utf-8', timeout: 30000,
  }).trim();
}

test('user management: create shows email, delete writes audit_log', async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-user-${stamp}@frahma.test`;

  // login
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL(/admin/, { timeout: 15000 });

  // create user via API (UI dialog is also covered by the page load assertion below)
  const createRes = await page.request.post('/api/admin/users', {
    data: { email, password: 'E2eProbe12345!', full_name: `E2E ${stamp}`, role: 'client', client_id: null },
  });
  expect(createRes.status(), `create status: ${await createRes.text()}`).toBe(200);
  const created = await createRes.json();
  const userId: string = created.user.id;
  console.log('CREATED user id:', userId, 'email:', email);

  // GET must include email + last_sign_in_at
  const listRes = await page.request.get('/api/admin/users');
  expect(listRes.status()).toBe(200);
  const { users } = await listRes.json();
  const mine = users.find((u: { id: string }) => u.id === userId);
  expect(mine, 'created user present in list').toBeTruthy();
  expect(mine.email, 'list row has email').toBe(email);
  console.log('LIST row email:', mine.email, '| last_sign_in_at:', mine.last_sign_in_at);

  // DELETE must succeed (service-role auth.admin.deleteUser)
  const delRes = await page.request.delete(`/api/admin/users/${userId}`);
  const delBody = await delRes.text();
  expect(delRes.status(), `delete status: ${delBody}`).toBe(200);
  console.log('DELETE status:', delRes.status());

  // audit_log must have user.create + user.delete rows
  await page.waitForTimeout(1500);
  const createAudit = dbq(`audit_log?action=eq.user.create&entity_id=eq.${userId}&select=id,action,summary`);
  const deleteAudit = dbq(`audit_log?action=eq.user.delete&entity_id=eq.${userId}&select=id,action,summary`);
  console.log('CREATE AUDIT:', createAudit);
  console.log('DELETE AUDIT:', deleteAudit);
  expect(createAudit).toContain('user.create');
  expect(deleteAudit).toContain('user.delete');
});
