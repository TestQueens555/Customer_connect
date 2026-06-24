const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:      './tests',
  timeout:       30000,
  retries:       1,
  fullyParallel: false,
  workers:       1,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true, suiteTitle: false }],
    ['html',  { outputFolder: 'reports/html-report', open: 'never' }],
    ['json',  { outputFile:  'reports/test-results.json' }],
  ],
  use: {
    baseURL:    'http://customerportal.dev-ts.online',
    headless:    true,
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  outputDir: 'reports/screenshots',
});
