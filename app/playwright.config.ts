import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// `.env.local` is authoritative: it overrides any stale BASE_URL inherited
// from the shell environment (which otherwise silently points tests at the
// wrong port, e.g. :3000 instead of the dev server's :3004).
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3004',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
