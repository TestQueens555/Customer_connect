const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:      './tests',
  globalSetup:  './global-setup.js',
  timeout:       60000,
  retries:       0,          // no retries — fail fast, fix fast
  fullyParallel: false,
  workers:       1,

  use: {
    baseURL:           'http://customerportal.dev-ts.online',
    headless:           true,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:      15000,
    navigationTimeout:  30000,
    storageState:      './reports/auth-session.json',
  },

  reporter: [
    ['list'],
    // JSON only — used by generate-report.js
    ['json', { outputFile: 'reports/test-results.json' }],
    // HTML report — lightweight, opens with npx playwright show-report
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
  ],

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  outputDir: 'reports/screenshots',
});
