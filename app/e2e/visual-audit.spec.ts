import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Automated Visual Audit', () => {
  test('Login and capture social accounts page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', exception => {
      consoleErrors.push(exception.message);
    });

    console.log('Navigating to login page...');
    await page.goto('/auth/login');

    console.log('Entering credentials...');
    // Pastikan kita berada di tab LOG IN
    await page.getByRole('tab', { name: /log in/i }).click();
    
    // Gunakan locator yang lebih spesifik dan tunggu hingga form siap
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('test-user@frhm.dev');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('TestPass123!');
    
    await page.getByRole('button', { name: /^log in$/i }).click();

    console.log('Waiting for redirect to dashboard...');
    await page.waitForURL('**/admin/**', { timeout: 15000 }).catch(async () => {
      await page.screenshot({ path: '../login-stuck.png' });
      console.log('Captured login-stuck.png');
      throw new Error('Timeout waiting for redirect to /admin/');
    });
    await expect(page.getByText('Social Accounts')).toBeVisible();

    console.log('Navigating to Social Accounts page...');
    await page.getByText('Social Accounts').click();
    await page.waitForURL('**/admin/social-accounts**', { timeout: 10000 });

    // Wait a bit for layout to settle and data to fetch
    await page.waitForTimeout(3000);

    const screenshotPath = '../social-accounts-audit.png';
    console.log(`Capturing Social Accounts screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    if (consoleErrors.length > 0) {
      console.log('--- FOUND CONSOLE ERRORS ---');
      consoleErrors.forEach(err => console.log('ERROR:', err));
      fs.writeFileSync('../audit-errors-social.log', consoleErrors.join('\n'));
      console.log('Console errors saved to audit-errors-social.log');
    } else {
      console.log('No console errors detected! The UI is clean.');
    }
  });
});
