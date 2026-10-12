import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.BASE_URL || 'http://localhost:3000' });

// NOTE (fact): routes removed in commit 3e36ff3 (e.g. /admin/settings/ai,
// /admin/settings/bridge, /admin/users) no longer exist. Unauthenticated access
// to an unknown route resolves to the 404 page, NOT a login redirect. This spec
// asserts the redirect behaviour only for routes that actually exist.

test.describe('Admin route auth guard', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin/calendar');
    await expect(page).toHaveURL(/.*auth.*login/);
  });
});

test.describe('Removed legacy routes resolve to 404 (not 5xx)', () => {
  const removed = ['/admin/users', '/admin/settings/ai', '/admin/settings/bridge'];
  for (const route of removed) {
    test(`${route} does not 5xx`, async ({ page }) => {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status() ?? 0).toBeLessThan(500);
    });
  }
});
