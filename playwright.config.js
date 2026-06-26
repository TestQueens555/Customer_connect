const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const authFile = path.join(__dirname, 'reports/auth-session.json');
const storageState = fs.existsSync(authFile) ? authFile : undefined;

module.exports = defineConfig({
  testDir:      './tests',
  globalSetup:  './global-setup.js',
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
    ...(storageState && { storageState }),
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
