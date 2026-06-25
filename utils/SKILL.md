---
name: test-report-generator
description: >
  Generate feature-wise Excel test reports and bug reports for the CustomerConnect project.
  Each report is named after the page/feature (e.g. Login.xlsx, Dashboard.xlsx).
  Each Excel file has two sheets: Sheet 1 = Test Case Execution, Sheet 2 = Bug Report.
  Also supports regression runs when features are modified — re-executes affected tests
  and updates the existing report with new results without losing history.
  ALL reports are automatically saved inside the project folder:
  D:\Claude\QA_Projects\CustomerConnect\Featurewise Test Report\
  Trigger this skill whenever the user says "generate test report", "create bug report",
  "test execution report", "feature report", "regression report", "update report after changes",
  "run regression", or "generate Excel report". Also trigger when tests finish running
  and the user wants results saved to Excel.
---

# Test Report Generator Skill

You are a **QA Reporting Engineer** for the CustomerConnect project. You generate feature-wise Excel test reports — one file per page/feature, with two sheets each: **Test Execution** and **Bug Report**. You also manage regression runs when features change.

---

## Project Structure

```
D:\Claude\QA_Projects\CustomerConnect\
├── pages\
├── tests\
├── test-data\
├── utils\
│   ├── config.js
│   └── generate-report.js
├── reports\                          ← Playwright JSON output (input to report generator)
├── Featurewise Test Report\          ← ALL Excel reports saved here automatically
│   ├── Login.xlsx
│   ├── Dashboard.xlsx
│   └── [Feature].xlsx
├── playwright.config.js
└── package.json
```

---

## CRITICAL OUTPUT RULE

Every Excel report MUST be saved to this folder inside the project:
```
D:\Claude\QA_Projects\CustomerConnect\Featurewise Test Report\
```

- This folder is created automatically with `fs.mkdirSync(OUTPUT_DIR, { recursive: true })`
- Use `path.join(__dirname, '../Featurewise Test Report')` — never hardcode the absolute path
- After saving, always print the full resolved path in the console

### Path constant to use in every script
```javascript
const OUTPUT_DIR = path.join(__dirname, '../Featurewise Test Report');
```

---

## Excel File Structure — Always Two Sheets

### Sheet 1: "Test Execution" — Columns

| Column | Field | Details |
|--------|-------|---------|
| A | Test Case ID | TC-LOGIN-001 |
| B | Test Case Name | Valid login with correct credentials |
| C | Module / Feature | Login |
| D | Test Type | Positive / Negative / Boundary / Error Handling |
| E | Priority | Critical / High / Medium / Low |
| F | Preconditions | User account must exist and be active |
| G | Test Steps | Step-by-step numbered actions |
| H | Test Data | Username: sajith_xyz, Password: User@123 |
| I | Expected Result | User redirected to dashboard |
| J | Actual Result | [Filled after execution] |
| K | Status | PASS / FAIL / BLOCKED / NOT RUN |
| L | Executed By | Tester name |
| M | Execution Date | DD-MMM-YYYY |
| N | Defect ID | BUG-001 (linked if failed) |
| O | Remarks | Any notes |

### Sheet 2: "Bug Report" — Columns

| Column | Field | Details |
|--------|-------|---------|
| A | Bug ID | BUG-LOGIN-001 |
| B | Title | Login fails with valid credentials |
| C | Module / Feature | Login |
| D | Linked TC ID | TC-LOGIN-001 |
| E | Severity | Critical / High / Medium / Low |
| F | Priority | P1 / P2 / P3 |
| G | Environment | http://customerportal.dev-ts.online / Chrome / Windows |
| H | Steps to Reproduce | Step-by-step |
| I | Expected Result | User should be redirected to dashboard |
| J | Actual Result | Error message shown despite correct credentials |
| K | Status | New / In Progress / Fixed / Verified / Closed / Reopen |
| L | Reported Date | DD-MMM-YYYY |
| M | Fixed Date | DD-MMM-YYYY |
| N | Regression Status | Pass / Fail / Not Run |
| O | Screenshot / Evidence | Screenshot filename or path |
| P | Remarks | Developer notes / comments |

---

## Report Generation Script — generate-report.js

```javascript
// utils/generate-report.js
// Usage: node utils/generate-report.js --feature=Login
// Usage: node utils/generate-report.js --feature=Login --regression

const XLSX    = require('xlsx');
const fs      = require('fs');
const path    = require('path');
const args    = process.argv.slice(2);

const featureArg   = args.find(a => a.startsWith('--feature='));
const isRegression = args.includes('--regression');
const feature      = featureArg ? featureArg.split('=')[1] : 'Login';

// ── OUTPUT PATH — relative to script, inside project ──────────────
const OUTPUT_DIR  = path.join(__dirname, '../Featurewise Test Report');
const reportPath  = path.join(OUTPUT_DIR, `${feature}.xlsx`);
const resultsFile = path.join(__dirname, '../reports/test-results.json');

function loadResults() {
  if (!fs.existsSync(resultsFile)) {
    console.error('❌ test-results.json not found. Run: npx playwright test first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
}

function flattenTests(raw) {
  const tests = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const result = t.results?.[0] || {};
        tests.push({
          title:    spec.title,
          suite:    suite.title,
          status:   result.status || 'unknown',
          duration: result.duration || 0,
          error:    result.error?.message || '',
        });
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return tests;
}

function mapStatus(s) {
  if (s === 'passed')  return 'PASS';
  if (s === 'failed')  return 'FAIL';
  if (s === 'skipped') return 'BLOCKED';
  return 'NOT RUN';
}

function getSeverity(title) {
  if (/valid login|TC-.*-001/i.test(title)) return 'Critical';
  if (/invalid|wrong|empty/i.test(title))   return 'High';
  if (/boundary|sql|xss|long/i.test(title)) return 'Medium';
  return 'Low';
}

function getPriority(severity) {
  return { Critical: 'P1', High: 'P2', Medium: 'P3', Low: 'P3' }[severity] || 'P3';
}

function generateReport() {
  const raw   = loadResults();
  const tests = flattenTests(raw);
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const now   = new Date().toLocaleString();

  let wb;
  let existingTCRows  = [];
  let existingBugRows = [];
  let bugCounter      = 1;

  if (isRegression && fs.existsSync(reportPath)) {
    console.log(`🔄 Regression mode — updating existing report: ${reportPath}`);
    wb = XLSX.readFile(reportPath);
    const tcSheet  = wb.Sheets['Test Execution'];
    const bugSheet = wb.Sheets['Bug Report'];
    existingTCRows  = tcSheet  ? XLSX.utils.sheet_to_json(tcSheet)  : [];
    existingBugRows = bugSheet ? XLSX.utils.sheet_to_json(bugSheet) : [];
    bugCounter      = existingBugRows.length + 1;
  } else {
    wb = XLSX.utils.book_new();
  }

  const tcHeader = [
    'Test Case ID', 'Test Case Name', 'Module / Feature', 'Test Type',
    'Priority', 'Preconditions', 'Test Steps', 'Test Data',
    'Expected Result', 'Actual Result', 'Status',
    'Executed By', 'Execution Date', 'Defect ID', 'Remarks'
  ];

  const tcRows = tests.map((t, i) => {
    const tcId     = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
    const status   = mapStatus(t.status);
    const defectId = status === 'FAIL' ? `BUG-${feature.toUpperCase()}-${String(bugCounter + i).padStart(3,'0')}` : '';

    if (isRegression) {
      const existing = existingTCRows.find(r => r['Test Case ID'] === tcId);
      if (existing) {
        return {
          ...existing,
          'Actual Result':  status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
          'Status':          status,
          'Execution Date':  today,
          'Defect ID':       defectId || existing['Defect ID'],
          'Remarks':         `Regression run - ${now}`,
        };
      }
    }

    return {
      'Test Case ID':     tcId,
      'Test Case Name':   t.title,
      'Module / Feature': feature,
      'Test Type':        /invalid|wrong|empty/i.test(t.title) ? 'Negative'
                        : /boundary|sql|xss|long/i.test(t.title) ? 'Boundary'
                        : /timeout|network|crash/i.test(t.title) ? 'Error Handling'
                        : 'Positive',
      'Priority':         getSeverity(t.title) === 'Critical' ? 'Critical' : 'High',
      'Preconditions':    'Application accessible at http://customerportal.dev-ts.online',
      'Test Steps':       '1. Navigate to page\n2. Perform action\n3. Verify result',
      'Test Data':        'Username: sajith_xyz | Password: User@123',
      'Expected Result':  'Test should pass per acceptance criteria',
      'Actual Result':    status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
      'Status':            status,
      'Executed By':      'Automation',
      'Execution Date':    today,
      'Defect ID':         defectId,
      'Remarks':           isRegression ? `Regression - ${now}` : '',
    };
  });

  const tcSheet = XLSX.utils.json_to_sheet(tcRows, { header: tcHeader });
  tcSheet['!cols'] = [
    {wch:14},{wch:45},{wch:18},{wch:16},{wch:10},{wch:30},
    {wch:40},{wch:30},{wch:35},{wch:35},{wch:10},
    {wch:14},{wch:16},{wch:14},{wch:25}
  ];

  const bugHeader = [
    'Bug ID', 'Title', 'Module / Feature', 'Linked TC ID',
    'Severity', 'Priority', 'Environment',
    'Steps to Reproduce', 'Expected Result', 'Actual Result',
    'Status', 'Reported Date', 'Fixed Date',
    'Regression Status', 'Screenshot / Evidence', 'Remarks'
  ];

  const failedTests = tests.filter(t => t.status === 'failed');

  const bugRows = failedTests.map((t, i) => {
    const tcId     = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
    const bugId    = `BUG-${feature.toUpperCase()}-${String(bugCounter + i).padStart(3,'0')}`;
    const severity = getSeverity(t.title);

    if (isRegression) {
      const existing = existingBugRows.find(r => r['Linked TC ID'] === tcId);
      if (existing) {
        return {
          ...existing,
          'Regression Status': 'Fail',
          'Remarks': `Still failing as of ${now}`,
        };
      }
    }

    return {
      'Bug ID':               bugId,
      'Title':                `[FAIL] ${t.title}`,
      'Module / Feature':     feature,
      'Linked TC ID':         tcId,
      'Severity':             severity,
      'Priority':             getPriority(severity),
      'Environment':          'http://customerportal.dev-ts.online | Chrome | Windows',
      'Steps to Reproduce':   '1. Navigate to page\n2. Execute test steps\n3. Observe failure',
      'Expected Result':      'Test should pass successfully',
      'Actual Result':        t.error || 'Test failed — see Playwright report for details',
      'Status':               'New',
      'Reported Date':         today,
      'Fixed Date':            '',
      'Regression Status':     isRegression ? 'Fail' : 'Not Run',
      'Screenshot / Evidence': `C:\\Users\\Turbosoft PC\\OneDrive\\Pictures\\Screenshots 1\\${tcId}-failure.png`,
      'Remarks':               '',
    };
  });

  if (isRegression) {
    const passedIds = tests.filter(t => t.status === 'passed')
                           .map(t => t.title.match(/TC-[\w-]+/)?.[0]).filter(Boolean);
    existingBugRows.forEach(bug => {
      if (passedIds.includes(bug['Linked TC ID'])) {
        bug['Regression Status'] = 'Pass';
        bug['Status']            = bug['Status'] === 'New' ? 'Fixed' : bug['Status'];
        bug['Remarks']           = `Verified fixed in regression - ${now}`;
      }
    });
  }

  const finalBugRows = isRegression
    ? [...existingBugRows.map(b => ({
        ...b,
        'Regression Status': failedTests.find(f => f.title.match(/TC-[\w-]+/)?.[0] === b['Linked TC ID'])
          ? 'Fail' : b['Regression Status']
      })),
      ...bugRows.filter(b => !existingBugRows.find(e => e['Linked TC ID'] === b['Linked TC ID']))
      ]
    : bugRows;

  const bugSheet = XLSX.utils.json_to_sheet(finalBugRows.length ? finalBugRows : [{}], { header: bugHeader });
  bugSheet['!cols'] = [
    {wch:16},{wch:50},{wch:18},{wch:14},{wch:10},{wch:8},
    {wch:40},{wch:45},{wch:35},{wch:45},
    {wch:12},{wch:14},{wch:12},{wch:16},{wch:50},{wch:30}
  ];

  if (wb.SheetNames.includes('Test Execution')) wb.SheetNames.splice(wb.SheetNames.indexOf('Test Execution'), 1);
  if (wb.SheetNames.includes('Bug Report'))     wb.SheetNames.splice(wb.SheetNames.indexOf('Bug Report'), 1);

  XLSX.utils.book_append_sheet(wb, tcSheet,  'Test Execution');
  XLSX.utils.book_append_sheet(wb, bugSheet, 'Bug Report');

  // ── Create folder + save inside project ──────────────────────────
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  XLSX.writeFile(wb, reportPath);

  const passed  = tests.filter(t => t.status === 'passed').length;
  const failed  = tests.filter(t => t.status === 'failed').length;
  const blocked = tests.filter(t => t.status === 'skipped').length;
  const total   = tests.length;
  const rate    = total ? ((passed / total) * 100).toFixed(1) : 0;

  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log(`📁 Folder: ${OUTPUT_DIR}`);
  console.log(`📊 ${feature} | Total: ${total} | Pass: ${passed} | Fail: ${failed} | Blocked: ${blocked} | Pass Rate: ${rate}%`);
  if (failed > 0) console.log(`🐛 ${failed} bug(s) logged in Bug Report sheet`);
  if (isRegression) console.log(`🔄 Regression complete — existing history preserved`);
}

generateReport();
```

---

## NPM Scripts

```json
{
  "scripts": {
    "test:login":            "npx playwright test tests/login.spec.js",
    "test:dashboard":        "npx playwright test tests/dashboard.spec.js",
    "report:login":          "node utils/generate-report.js --feature=Login",
    "report:dashboard":      "node utils/generate-report.js --feature=Dashboard",
    "run:login":             "npm run test:login && npm run report:login",
    "run:dashboard":         "npm run test:dashboard && npm run report:dashboard",
    "regression:login":      "npm run test:login && node utils/generate-report.js --feature=Login --regression",
    "regression:dashboard":  "npm run test:dashboard && node utils/generate-report.js --feature=Dashboard --regression",
    "regression:all":        "npx playwright test && node utils/generate-report.js --feature=All --regression"
  }
}
```

---

## How Regression Works

When a feature is modified:

1. Developer makes a code change
2. QA runs: `npm run regression:login`
3. Script re-executes all Login tests
4. Opens `Login.xlsx` from `Featurewise Test Report\` folder and:
   - Updates **Status** column for each TC
   - Updates **Regression Status** in Bug Report sheet
   - Marks previously failing bugs as **Pass** if now fixed
   - Adds NEW bugs for any newly failing tests
   - Preserves full history — nothing is deleted
