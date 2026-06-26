// utils/generate-report.js
// Playwright auto-save report — runs after npx playwright test
// Saves to: Test Execution Report/Feature Reports/[Feature].xlsx  (Sheet1: Test Execution 16-col, Sheet2: Bug Report 16-col)
// Also appends to: Test Execution Report/Daily Reports/BugReport_DD-Mon-YYYY.xlsx (19 cols)
//
// Usage: node utils/generate-report.js --feature=Login
//        node utils/generate-report.js --feature=Login --regression

'use strict';
const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args         = process.argv.slice(2);
const featureArg   = args.find(a => a.startsWith('--feature='));
const isRegression = args.includes('--regression');
const feature      = featureArg ? featureArg.split('=')[1] : 'Login';

const FEATURE_DIR  = path.join(__dirname, `../${process.env.REPORT_DIR || 'Test Execution Report'}/Feature Reports`);
const DAILY_DIR    = path.join(__dirname, `../${process.env.REPORT_DIR || 'Test Execution Report'}/Daily Reports`);
const reportPath   = path.join(FEATURE_DIR, `${feature}.xlsx`);
const resultsFile  = path.join(__dirname, '../reports/test-results.json');

const today     = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe  = today.replace(/ /g, '-');
const dailyPath = path.join(DAILY_DIR, `BugReport_${fileSafe}.xlsx`);
const now       = new Date().toLocaleString();

// ── Column headers ────────────────────────────────────────────────────────────

// Sheet 1 — Test Execution (16 columns A–P)
const TC_HEADER = [
  'TC ID','Test Case Name','Module','Test Type','Priority',
  'Layer',           // Unit | API | Auto  (test-pyramid-classification skill)
  'Preconditions','Test Steps','Test Data',
  'Expected Result','Actual Result','Status',
  'Executed By','Execution Date','Environment','Remarks',
];

// Sheet 2 — Bug Report (16 columns A–P)
const BUG_HEADER = [
  'Bug ID','Title','Module','Linked TC ID','Severity','Priority',
  'Environment','Steps to Reproduce','Expected Result','Actual Result',
  'Status','Reported By','Reported Date','Fixed Date','Regression Status','Remarks',
];

// Daily Bug Report (19 columns A–S)
const DAILY_HEADER = [
  'Date','Feature','TC ID','Test Case Name','Test Type',
  'Layer',           // Unit | API | Auto
  'Priority','Status','Bug ID','Bug Title','Severity','Bug Priority',
  'Environment','Browser','OS',
  'Steps to Reproduce','Expected Result','Actual Result','Source Report',
];

// ── Classifiers ───────────────────────────────────────────────────────────────
function getTestType(title) {
  if (/sql|xss|injection|unauthenticated|security/i.test(title))               return 'Security';
  if (/boundary|max|256|length|special|whitespace|case.insensitive/i.test(title)) return 'Boundary';
  if (/invalid|wrong|empty|fail|blocked|rejected/i.test(title))                return 'Negative';
  return 'Positive';
}

function getSeverity(title) {
  if (/TC-.*-001|valid login|page load/i.test(title))                          return 'Critical';
  if (/invalid|wrong|empty|sql|xss|security|unauthenticated/i.test(title))     return 'High';
  if (/boundary|max|length|256|special|whitespace/i.test(title))               return 'Medium';
  return 'Low';
}

function getPriority(sev) {
  return { Critical:'P1', High:'P2', Medium:'P3', Low:'P3' }[sev] || 'P3';
}

// Layer — Unit / API / Auto (from test-pyramid-classification skill)
function getLayer(title) {
  if (/empty|whitespace|masked|default|checkbox|toggle|type.*password|password.*type/i.test(title))
    return 'Unit';
  if (/redirect|page load|navigate|unauthenticated|visible|dashboard|tab|badge|search|profile/i.test(title))
    return 'Auto';
  return 'API';
}

function mapStatus(s) {
  if (s === 'passed')  return 'PASS';
  if (s === 'failed')  return 'FAIL';
  if (s === 'skipped') return 'BLOCKED';
  return 'NOT RUN';
}

// Strip ANSI escape codes from Playwright error messages
function cleanError(msg) {
  return (msg || '').replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').substring(0, 300).trim();
}

function setColWidths(sheet, widths) {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

// ── Load Playwright JSON results ───────────────────────────────────────────────
function loadResults() {
  if (!fs.existsSync(resultsFile)) {
    console.warn('⚠  test-results.json not found — generating empty report');
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const tests = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const r = t.results?.[0] || {};
        tests.push({ title: spec.title, suite: suite.title,
          status: r.status || 'unknown', error: cleanError(r.error?.message || '') });
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return tests;
}

// ── Main ──────────────────────────────────────────────────────────────────────
fs.mkdirSync(FEATURE_DIR, { recursive: true });
fs.mkdirSync(DAILY_DIR,   { recursive: true });

const tests = loadResults();
let wb, existingTCRows = [], existingBugRows = [], bugCounter = 1;

if (isRegression && fs.existsSync(reportPath)) {
  console.log(`🔄 Regression mode — updating: ${reportPath}`);
  wb = XLSX.readFile(reportPath);
  existingTCRows  = wb.Sheets['Test Execution'] ? XLSX.utils.sheet_to_json(wb.Sheets['Test Execution'])  : [];
  existingBugRows = wb.Sheets['Bug Report']     ? XLSX.utils.sheet_to_json(wb.Sheets['Bug Report'])      : [];
  bugCounter      = existingBugRows.length + 1;
} else {
  wb = XLSX.utils.book_new();
}

// ── Sheet 1: Test Execution (16 cols) ─────────────────────────────────────────
const tcRows = tests.map((t, i) => {
  const tcId   = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const status = mapStatus(t.status);
  const sev    = getSeverity(t.title);
  const layer  = getLayer(t.title);

  if (isRegression) {
    const existing = existingTCRows.find(r => r['TC ID'] === tcId);
    if (existing) return {
      ...existing, 'Layer': layer,
      'Actual Result':  status === 'PASS' ? 'Test passed via Playwright automation' : (t.error || 'Test failed'),
      'Status': status, 'Execution Date': today,
      'Executed By': 'Playwright Automation', 'Remarks': `Regression run — ${now}`,
    };
  }

  return {
    'TC ID': tcId, 'Test Case Name': t.title, 'Module': feature,
    'Test Type': getTestType(t.title), 'Priority': sev, 'Layer': layer,
    'Preconditions': 'Application accessible at http://customerportal.dev-ts.online; user sajith_xyz active',
    'Test Steps':    `(See Playwright spec: tests/${feature.toLowerCase()}.spec.js)`,
    'Test Data':     `See test-data/${feature.toLowerCase()}Data.js`,
    'Expected Result': 'Test assertions pass per spec definition',
    'Actual Result': status === 'PASS' ? 'All assertions passed via Playwright' : (t.error || 'Test failed'),
    'Status': status, 'Executed By': 'Playwright Automation',
    'Execution Date': today,
    'Environment': 'http://customerportal.dev-ts.online | Chrome | Windows | Headless',
    'Remarks': '',
  };
});

const tcSheet = XLSX.utils.json_to_sheet(tcRows.length ? tcRows : [{}], { header: TC_HEADER });
setColWidths(tcSheet, [14,45,10,12,10,8,28,36,28,38,44,8,22,14,40,28]);

// ── Sheet 2: Bug Report (16 cols) ─────────────────────────────────────────────
const failedTests = tests.filter(t => t.status === 'failed');

const bugRows = failedTests.map((t, i) => {
  const tcId  = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const bugId = `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}`;
  const sev   = getSeverity(t.title);

  if (isRegression) {
    const existing = existingBugRows.find(r => r['Linked TC ID'] === tcId);
    if (existing) return { ...existing, 'Regression Status': 'Fail', 'Remarks': `Still failing in Playwright — ${now}` };
  }

  return {
    'Bug ID': bugId, 'Title': `[FAIL] ${t.title}`, 'Module': feature, 'Linked TC ID': tcId,
    'Severity': sev, 'Priority': getPriority(sev),
    'Environment': 'http://customerportal.dev-ts.online | Chrome | Windows | Headless',
    'Steps to Reproduce': `See spec: tests/${feature.toLowerCase()}.spec.js\nTC: ${tcId}`,
    'Expected Result': 'All Playwright assertions pass',
    'Actual Result': t.error || 'Playwright test failed',
    'Status': 'New', 'Reported By': 'Playwright Automation', 'Reported Date': today,
    'Fixed Date': '', 'Regression Status': isRegression ? 'Fail' : 'Not Run', 'Remarks': '',
  };
});

if (isRegression) {
  const passedIds = tests.filter(t => t.status === 'passed').map(t => t.title.match(/TC-[\w-]+/)?.[0]).filter(Boolean);
  existingBugRows.forEach(bug => {
    if (passedIds.includes(bug['Linked TC ID'])) {
      bug['Regression Status'] = 'Pass'; bug['Status'] = 'Fixed';
      bug['Fixed Date'] = today; bug['Remarks'] = `Fixed — verified in Playwright regression ${now}`;
    }
  });
}

const finalBugRows = isRegression
  ? [...existingBugRows, ...bugRows.filter(b => !existingBugRows.find(e => e['Linked TC ID'] === b['Linked TC ID']))]
  : bugRows;

const bugSheet = XLSX.utils.json_to_sheet(finalBugRows.length ? finalBugRows : [{}], { header: BUG_HEADER });
setColWidths(bugSheet, [18,50,10,14,10,8,40,42,36,46,10,22,14,12,16,30]);

// Write feature report
['Test Execution','Bug Report'].forEach(name => {
  if (wb.SheetNames.includes(name)) { wb.SheetNames.splice(wb.SheetNames.indexOf(name),1); delete wb.Sheets[name]; }
});
XLSX.utils.book_append_sheet(wb, tcSheet,  'Test Execution');
XLSX.utils.book_append_sheet(wb, bugSheet, 'Bug Report');
XLSX.writeFile(wb, reportPath);

const passed = tests.filter(t => t.status === 'passed').length;
const failed = tests.filter(t => t.status === 'failed').length;
const rate   = tests.length ? ((passed / tests.length) * 100).toFixed(1) : 0;
console.log(`✅ Feature report: ${reportPath}`);
console.log(`📊 ${feature} | Total:${tests.length} Pass:${passed} Fail:${failed} Rate:${rate}%`);
if (failed > 0) console.log(`🐛 ${failed} bug(s) in Bug Report sheet`);

// ── Daily Bug Report (append mode, 19 cols) ───────────────────────────────────
let dwb, existingDailyRows = [];

if (fs.existsSync(dailyPath)) {
  dwb = XLSX.readFile(dailyPath);
  const dsheet = dwb.Sheets['Daily Bug Report'];
  existingDailyRows = dsheet ? XLSX.utils.sheet_to_json(dsheet) : [];
  console.log(`📋 Daily report: appending (${existingDailyRows.length} existing rows)`);
} else {
  dwb = XLSX.utils.book_new();
}

const existingTcIds = new Set(existingDailyRows.map(r => r['TC ID']));
let dailyBugNum = existingDailyRows.filter(r => r['Bug ID'] && r['Bug ID'] !== '—').length + 1;
const newDailyRows = [];

if (failedTests.length === 0) {
  const summaryKey = `${tests[0]?.title?.match(/TC-[\w-]+/)?.[0] || feature}-summary`;
  if (!existingTcIds.has(summaryKey)) {
    const firstId = tests[0]?.title?.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-001`;
    const lastId  = tests[tests.length-1]?.title?.match(/TC-[\w-]+/)?.[0] || '';
    newDailyRows.push({
      'Date': today, 'Feature': feature, 'TC ID': summaryKey,
      'Test Case Name': `All ${tests.length} TCs — ${feature} module (${firstId} → ${lastId})`,
      'Test Type': 'All types', 'Layer': 'Unit / API / Auto', 'Priority': 'Critical–Low',
      'Status': 'PASS', 'Bug ID': '—', 'Bug Title': `No bugs — ${tests.length}/${tests.length} TCs passed`,
      'Severity': '—', 'Bug Priority': '—', 'Environment': 'http://customerportal.dev-ts.online',
      'Browser': 'Chrome', 'OS': 'Windows',
      'Steps to Reproduce': `${tests.length} TCs via Playwright (tests/${feature.toLowerCase()}.spec.js)`,
      'Expected Result': `All ${tests.length} TCs pass`,
      'Actual Result': `${passed}/${tests.length} PASS ✓  Pass Rate: 100%`,
      'Source Report': `Test Execution Report\\Feature Reports\\${feature}.xlsx`,
    });
  }
} else {
  failedTests.forEach((t, i) => {
    const tcId = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
    if (existingTcIds.has(tcId)) return;
    const sev   = getSeverity(t.title);
    const bugId = `BUG-${feature.toUpperCase()}-${String(dailyBugNum++).padStart(3,'0')}`;
    newDailyRows.push({
      'Date': today, 'Feature': feature, 'TC ID': tcId, 'Test Case Name': t.title,
      'Test Type': getTestType(t.title), 'Layer': getLayer(t.title), 'Priority': sev,
      'Status': 'FAIL', 'Bug ID': bugId, 'Bug Title': `[FAIL] ${t.title}`,
      'Severity': sev, 'Bug Priority': getPriority(sev),
      'Environment': 'http://customerportal.dev-ts.online', 'Browser': 'Chrome', 'OS': 'Windows',
      'Steps to Reproduce': `See spec: tests/${feature.toLowerCase()}.spec.js  TC: ${tcId}`,
      'Expected Result': 'All Playwright assertions pass',
      'Actual Result': t.error || 'Playwright test failed',
      'Source Report': `Test Execution Report\\Feature Reports\\${feature}.xlsx`,
    });
  });
  if (passed > 0) {
    const passedKey = `${feature}-passed-${today}`;
    if (!existingTcIds.has(passedKey)) {
      newDailyRows.push({
        'Date': today, 'Feature': feature, 'TC ID': passedKey,
        'Test Case Name': `${passed} TCs passed — ${feature} (FAILs above)`,
        'Test Type': 'Mixed', 'Layer': 'Mixed', 'Priority': 'Mixed',
        'Status': 'PASS', 'Bug ID': '—', 'Bug Title': `${passed}/${tests.length} TCs passed`,
        'Severity': '—', 'Bug Priority': '—', 'Environment': 'http://customerportal.dev-ts.online',
        'Browser': 'Chrome', 'OS': 'Windows',
        'Steps to Reproduce': `Playwright run: tests/${feature.toLowerCase()}.spec.js`,
        'Expected Result': 'Assertions pass', 'Actual Result': `${passed}/${tests.length} PASS | ${failed} FAILs logged`,
        'Source Report': `Test Execution Report\\Feature Reports\\${feature}.xlsx`,
      });
    }
  }
}

const allDailyRows = [...existingDailyRows, ...newDailyRows];
const dsheet = XLSX.utils.json_to_sheet(allDailyRows.length ? allDailyRows : [{}], { header: DAILY_HEADER });
dsheet['!cols'] = [
  {wch:13},{wch:14},{wch:22},{wch:44},{wch:11},{wch:10},{wch:10},{wch:8},
  {wch:20},{wch:46},{wch:10},{wch:10},{wch:36},{wch:9},{wch:9},
  {wch:44},{wch:36},{wch:50},{wch:40},
];

if (dwb.SheetNames.includes('Daily Bug Report')) {
  dwb.SheetNames.splice(dwb.SheetNames.indexOf('Daily Bug Report'),1); delete dwb.Sheets['Daily Bug Report'];
}
XLSX.utils.book_append_sheet(dwb, dsheet, 'Daily Bug Report');
XLSX.writeFile(dwb, dailyPath);

console.log(`✅ Daily Bug Report: ${dailyPath}`);
console.log(`📅 New rows: ${newDailyRows.length} | Total rows: ${allDailyRows.length}`);
