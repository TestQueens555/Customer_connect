const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:      './tests',
  timeout:       60000,   // increased from 30s — Dashboard sidebar/filter interactions need more time
  retries:       1,
  fullyParallel: false,
  workers:       1,

  use: {
    baseURL:       'http://customerportal.dev-ts.online',
    headless:       true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'on-first-retry',
    actionTimeout:  15000,  // max wait for any single click/fill/locator action
    navigationTimeout: 30000,
  },

  reporter: [
    ['list'],

    // ── Monocart — single self-contained HTML, opens without a server ──
    ['monocart-reporter', {
      name:       'CustomerConnect QA — Test Report',
      outputFile: 'reports/monocart/index.html',

      // columns shown in the report table
      columns: (defaultColumns) => {
        const idCol = {
          id:    'tc_id',
          name:  'TC ID',
          align: 'center',
          width: 130,
          searchable: true,
          formatter: (v) => v || ''
        };
        defaultColumns.splice(1, 0, idCol);
        return defaultColumns;
      },

      // summary trend chart
      trend: './reports/monocart/trend.json',

      // on-fail extras
      onEnd: async (reportData, capability) => {
        console.log('Monocart report:', reportData.outputFile);
        console.log(`Total: ${reportData.summary.tests} | Pass: ${reportData.summary.passed} | Fail: ${reportData.summary.failed}`);
      }
    }],

    // ── Built-in Playwright HTML (also single file) ────────────────────
    ['html', {
      outputFolder: 'reports/html-report',
      open:         'never'
    }],

    // ── JSON for scripting / CI ────────────────────────────────────────
    ['json', { outputFile: 'reports/test-results.json' }],
  ],

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  outputDir: 'reports/screenshots',
});
