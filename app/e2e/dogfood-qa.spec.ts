import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'dogfood-output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3004';

const issues: any[] = [];

function addIssue(title: string, severity: 'Critical' | 'High' | 'Medium' | 'Low', category: string, url: string, description: string, steps: string[], expected: string, actual: string, screenshot?: string, consoleErrors?: string[]) {
  issues.push({ title, severity, category, url, description, steps, expected, actual, screenshot, consoleErrors });
}

async function captureScreenshot(page: any, name: string) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

test.describe('Dogfood QA - Full Site Exploration', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      console.log(`Page Error: ${error.message}`);
    });
  });

  test('Home page - load and navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const screenshot = await captureScreenshot(page, '01-home-page');
    const url = page.url();
    if (!url.includes('/auth/login')) {
      addIssue('Home page accessible without auth', 'Medium', 'Functional', url, 
        'Home page should redirect to login when not authenticated', 
        ['Visit /'], 'Redirect to /auth/login', 'Home page rendered', screenshot);
    }
  });

  test('Login page - UI and functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    const screenshot = await captureScreenshot(page, '02-login-page');
    
    // Check radius consistency
    const radiusValues = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, [role="tab"]');
      const radii = new Set<string>();
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        radii.add(style.borderRadius);
      });
      return Array.from(radii);
    });
    console.log('Border radius values:', radiusValues);
    
    // Test Google button click
    const googleBtn = page.locator('button:has-text("Google")').first();
    if (await googleBtn.isVisible()) {
      await googleBtn.click();
      await page.waitForTimeout(500);
      const errorToast = page.locator('text=Google OAuth belum').first();
      if (await errorToast.isVisible()) {
        console.log('Google OAuth not configured toast shown');
      }
    }
  });

  test('Admin routes - redirect to login', async ({ page }) => {
    test.setTimeout(120000);
    const adminRoutes = [
      '/admin/dashboard', '/admin/clients', '/admin/deliverables',
      '/admin/deliverables/new', '/admin/calendar', '/admin/skills',
      '/admin/audit', '/admin/users', '/admin/settings/ai',
      '/admin/settings/bridge', '/admin/analytics'
    ];
    
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForURL('**/auth/login**', { timeout: 10000 });
      const url = page.url();
      const screenshot = await captureScreenshot(page, `05-admin-${route.replace(/\//g, '-')}`);
      
      if (!url.includes('/auth/login')) {
        addIssue(`Admin route ${route} accessible without auth`, 'High', 'Functional', url,
          `Admin route ${route} should redirect to login`, 
          [`Visit ${route}`], 'Redirect to /auth/login', `Loaded ${route} directly`, screenshot);
      }
    }
  });

  test('Client routes - redirect to login', async ({ page }) => {
    const clientRoutes = [
      '/client/dashboard', '/client/deliverables',
      '/client/calendar', '/client/pipeline'
    ];
    
    for (const route of clientRoutes) {
      await page.goto(`${BASE_URL}${route}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
      await page.waitForURL('**/auth/login**', { timeout: 10000 });
      const url = page.url();
      const screenshot = await captureScreenshot(page, `06-client-${route.replace(/\//g, '-')}`);
      
      if (!url.includes('/auth/login')) {
        addIssue(`Client route ${route} accessible without auth`, 'High', 'Functional', url,
          `Client route ${route} should redirect to login`, 
          [`Visit ${route}`], 'Redirect to /auth/login', `Loaded ${route} directly`, screenshot);
      }
    }
  });

  test('404 page', async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-page`);
    await page.waitForLoadState('networkidle');
    const screenshot = await captureScreenshot(page, '07-404-page');
    const url = page.url();
    const hasCustom404 = await page.locator('text=Frhm').isVisible().catch(() => false);
    const hasDefaultNextjs404 = await page.locator('text=This page could not be found').isVisible().catch(() => false);
    
    if (hasDefaultNextjs404 && !hasCustom404) {
      addIssue('Default Next.js 404 page shown', 'Low', 'Visual', url,
        'No custom 404 page - shows default Next.js error', 
        ['Visit /non-existent-page'], 'Custom 404 with navigation to home', 'Default Next.js 404', screenshot);
    }
  });

  test.afterAll(async () => {
    const reportPath = path.join(OUTPUT_DIR, 'report.md');
    let report = `# Dogfood QA Report - Frhm Digital Marketing Platform\n\n`;
    report += `**Total Issues:** ${issues.length}\n\n`;
    
    issues.forEach((issue, idx) => {
      report += `### Issue ${idx + 1}: ${issue.title}\n\n`;
      report += `**Severity:** ${issue.severity} | **Category:** ${issue.category} | **URL:** ${issue.url}\n\n`;
      report += `**Expected:** ${issue.expected}\n**Actual:** ${issue.actual}\n\n---\n\n`;
    });
    
    fs.writeFileSync(reportPath, report);
  });
});