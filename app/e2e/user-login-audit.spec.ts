import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('E2E Login & Quality Audit', () => {
  test.use({ baseURL: BASE_URL });

  test('audit login and full dashboard navigation for test-user@frhm.dev', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const failedResponses: { url: string; status: number; text: string }[] = [];
    page.on('response', async (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('sentry')) {
        let text = '';
        try {
          text = await res.text();
        } catch {
          // ignore
        }
        failedResponses.push({ url: res.url(), status: res.status(), text: text.slice(0, 300) });
      }
    });

    console.log(`\n=== 1. LOGIN ATTEMPT ===`);
    console.log(`[E2E] Opening ${BASE_URL}/auth/login...`);
    await page.goto('/auth/login', { waitUntil: 'networkidle' });

    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    console.log('[E2E] Entering credentials for test-user@frhm.dev...');
    await emailInput.fill('test-user@frhm.dev');
    await passwordInput.fill('TestPass123!');

    console.log('[E2E] Clicking login submit...');
    await submitBtn.click();

    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
    const landingUrl = page.url();
    console.log(`[E2E] Successfully landed on: ${landingUrl}`);

    // Verify user role based on landing URL
    const isAdmin = landingUrl.includes('/admin');
    console.log(`[E2E] Resolved user session role: ${isAdmin ? 'ADMIN' : 'CLIENT'}`);

    const pagesToAudit = isAdmin
      ? [
          { name: 'Admin Dashboard', path: '/admin/dashboard' },
          { name: 'Admin Clients', path: '/admin/clients' },
          { name: 'Admin Deliverables', path: '/admin/deliverables' },
          { name: 'Admin CRM', path: '/admin/crm' },
          { name: 'Admin Automations', path: '/admin/automations' },
          { name: 'Admin Production', path: '/admin/production' },
          { name: 'Admin Analytics', path: '/admin/analytics' },
        ]
      : [
          { name: 'Client Dashboard', path: '/client/dashboard' },
          { name: 'Client Approvals', path: '/client/approvals' },
          { name: 'Client Calendar', path: '/client/calendar' },
          { name: 'Client Deliverables', path: '/client/deliverables' },
        ];

    console.log(`\n=== 2. ROUTE & QUALITY AUDIT ===`);
    const routeResults: { name: string; path: string; status: string; title: string; heading: string }[] = [];

    for (const route of pagesToAudit) {
      console.log(`[E2E] Auditing ${route.name} (${route.path})...`);
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const status = response ? `${response.status()}` : 'no-response';
      const title = await page.title();
      
      // Get heading if present
      let heading = '';
      const h1 = page.locator('h1').first();
      if (await h1.count() > 0) {
        heading = (await h1.innerText()).trim();
      }

      routeResults.push({
        name: route.name,
        path: route.path,
        status,
        title,
        heading,
      });

      console.log(`  -> HTTP Status: ${status} | Title: "${title}" | H1: "${heading}"`);

      // Verify page container or header exists
      const pageHeader = page.locator('[data-slot="page-container"], h1, main');
      await expect(pageHeader.first()).toBeVisible({ timeout: 5000 });
    }

    // Capture screenshot of the last audited page
    await page.screenshot({ path: 'audit-admin-dashboard.png', fullPage: true });

    console.log(`\n=== 3. AUDIT SUMMARY ===`);
    console.log(`Total Routes Audited: ${routeResults.length}`);
    console.table(routeResults);

    console.log(`\n=== 4. CONSOLE ERRORS & FAILED REQUESTS ===`);
    console.log(`Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, idx) => console.log(`  [Error ${idx + 1}] ${err.slice(0, 200)}`));
    }
    console.log(`Failed HTTP responses count: ${failedResponses.length}`);
    if (failedResponses.length > 0) {
      failedResponses.forEach((fail, idx) => console.log(`  [Fail ${idx + 1}] Status ${fail.status} on ${fail.url}`));
    }

    expect(routeResults.every(r => r.status === '200' || r.status === '304')).toBeTruthy();
  });
});
