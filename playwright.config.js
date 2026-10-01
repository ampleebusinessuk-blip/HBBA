import { defineConfig, devices } from '@playwright/test';

// Browser tests live outside test/ because `node --test` treats every file in
// that directory as a Node test, and a Playwright spec cannot run under it.
// Every spec drives the same app instance from one address, so the per-IP rate
// limit would start answering 429 part-way through a run. These raise the
// ceiling for the suite only; production keeps its defaults.
process.env.API_RATE_LIMIT ||= '5000';
process.env.AUTH_RATE_LIMIT ||= '500';

export default defineConfig({
  testDir: './e2e',
  // One pool for the whole run, closed once at the end.
  globalTeardown: './e2e/global-teardown.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
