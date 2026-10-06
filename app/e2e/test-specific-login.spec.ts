import { test, expect } from '@playwright/test';

test('Test Frahma Login Flow for test-user@frhm.dev', async ({ page }) => {
  // 1. Buka halaman login
  await page.goto('http://localhost:3000/auth/login');
  
  // Capture screenshot of the initial load
  await page.screenshot({ path: 'playwright-report/initial_load.png' });

  // Wait a bit to let client-side JS hydrate
  await page.waitForTimeout(5000);
  
  // Capture screenshot after hydration
  await page.screenshot({ path: 'playwright-report/after_hydration.png' });

  // Tunggu sampai elemen form muncul
  await page.waitForSelector('input[name="email"]');

  // 2. Ketik email
  await page.fill('input[name="email"]', 'test-user@frhm.dev');
  
  // 3. Ketik password
  await page.fill('input[name="password"]', 'TestPass123!');
  
  // 4. Klik submit
  await page.click('button[type="submit"]');

  // 5. Verifikasi URL
  try {
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log("LOGIN SUCCESS: Redirected to /admin/dashboard");
    await page.screenshot({ path: 'playwright-report/login_success.png' });
  } catch (error) {
    console.log("LOGIN REDIRECT TIMEOUT. Checking for error messages on page...");
    
    // Coba tangkap Notice alert error jika ada
    const errorNotice = await page.$('div[role="alert"]');
    if (errorNotice) {
      const errorText = await errorNotice.textContent();
      console.error("LOGIN FAILED WITH ERROR:", errorText);
    }
    
    await page.screenshot({ path: 'playwright-report/login_failed.png' });
    throw error;
  }
});
