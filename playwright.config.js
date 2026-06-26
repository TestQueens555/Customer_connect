const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

// storageState only used locally — CI each spec handles its own login
const authFile     = path.join(__dirname, 'reports/auth-session.json');
const storageState = fs.existsSync(authFile) ? authFile : undefined;
const isCI         = process.env.CI === 'true';

module.exports = defineConfig({
  testDir:      './tests',
  globalSetup:  isCI ? undefined : './global-setup.js',  // skip on CI
  timeout:       60000,
  retries:       0,
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
    // storageState only applied locally when file exists
    ...(!isCI && storageState && { storageState }),
  },

  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
  ],

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  outputDir: 'reports/screenshots',
});
