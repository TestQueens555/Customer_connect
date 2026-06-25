// utils/generate-report.js
// Generates Feature-wise Excel report → Test Execution Report/Feature Reports/[Feature].xlsx
// Sheet 1: Test Execution  (15 columns)
// Sheet 2: Bug Report      (16 columns)
// Usage: node utils/generate-report.js --feature=Login
// Usage: node utils/generate-report.js --feature=Login --regression

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args         = process.argv.slice(2);
const featureArg   = args.find(a => a.startsWith('--feature='));
const isRegression = args.includes('--regression');
const feature      = featureArg ? featureArg.split('=')[1] : 'Login';
const reportDir    = path.join(__dirname, '../Test Execution Report/Feature Reports');
const reportPath   = path.join(reportDir, `${feature}.xlsx`);
const resultsFile  = path.join(__dirname, '../reports/test-results.json');
const today        = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const now          = new Date().toLocaleString();

// ── Canonical column definitions ──────────────────────────────────────────────

// Sheet 1 — Test Execution (15 columns)
const TC_HEADER = [
  'TC ID',            // A
  'Test Case Name',   // B
  'Module',           // C
  'Test Type',        // D
  'Priority',         // E
  'Preconditions',    // F
  'Test Steps',       // G
  'Test Data',        // H
  'Expected Result',  // I
  'Actual Result',    // J
  'Status',           // K
  'Executed By',      // L
  'Execution Date',   // M
  'Environment',      // N
  'Remarks',          // O
];

// Sheet 2 — Bug Report (16 columns)
const BUG_HEADER = [
  'Bug ID',               // A
  'Title',                // B
  'Module',               // C
  'Linked TC ID',         // D
  'Severity',             // E
  'Priority',             // F
  'Environment',          // G
  'Steps to Reproduce',   // H
  'Expected Result',      // I
  'Actual Result',        // J
  'Status',               // K
  'Reported By',          // L
  'Reported Date',        // M
  'Fixed Date',           // N
  'Regression Status',    // O
  'Remarks',              // P
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadResults() {
  if (!fs.existsSync(resultsFile)) {
    console.warn('⚠ test-results.json not found — generating empty report');
    return [];
  }
  const raw   = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const tests = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const r = t.results?.[0] || {};
        tests.push({
          title:    spec.title,
          suite:    suite.title,
          status:   r.status || 'unknown',
          duration: r.duration || 0,
          error:    r.error?.message?.replace(/\n/g, ' ').substring(0, 200) || '',
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
  if (/TC-.*-001|valid login|page load/i.test(title)) return 'Critical';
  if (/invalid|wrong|empty|sql|xss|security|unauthenticated/i.test(title)) return 'High';
  if (/boundary|max|length|256|special|whitespace/i.test(title)) return 'Medium';
  return 'Low';
}

function getPriority(s) {
  return { Critical:'P1', High:'P2', Medium:'P3', Low:'P3' }[s] || 'P3';
}

function getTestType(title) {
  if (/sql|xss|injection|unauthenticated|security/i.test(title)) return 'Security';
  if (/boundary|max|256|length|special|whitespace|case.insensitive/i.test(title)) return 'Boundary';
  if (/invalid|wrong|empty|fail|blocked|rejected/i.test(title)) return 'Negative';
  return 'Positive';
}

function setColWidths(sheet, widths) {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

// ── Load existing workbook for regression ─────────────────────────────────────
fs.mkdirSync(reportDir, { recursive: true });
const tests = loadResults();

let wb;
let existingTCRows  = [];
let existingBugRows = [];
let bugCounter      = 1;

if (isRegression && fs.existsSync(reportPath)) {
  console.log(`🔄 Regression mode — updating: ${reportPath}`);
  wb              = XLSX.readFile(reportPath);
  const tcSheet   = wb.Sheets['Test Execution'];
  const bugSheet  = wb.Sheets['Bug Report'];
  existingTCRows  = tcSheet  ? XLSX.utils.sheet_to_json(tcSheet)  : [];
  existingBugRows = bugSheet ? XLSX.utils.sheet_to_json(bugSheet) : [];
  bugCounter      = existingBugRows.length + 1;
} else {
  wb = XLSX.utils.book_new();
}

// ── Sheet 1: Test Execution ───────────────────────────────────────────────────
const tcRows = tests.map((t, i) => {
  const tcId    = t.title.match(/TC-[\w-]+/)?.[0]
                  || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const status  = mapStatus(t.status);
  const defectId = status === 'FAIL'
                  ? `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}`
                  : '';

  if (isRegression) {
    const existing = existingTCRows.find(r => r['TC ID'] === tcId);
    if (existing) return {
      ...existing,
      'Actual Result':  status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
      'Status':          status,
      'Execution Date':  today,
      'Executed By':    'Claude QA Automation',
      'Remarks':        `Regression run — ${now}`,
    };
  }

  return {
    'TC ID':           tcId,
    'Test Case Name':  t.title,
    'Module':          feature,
    'Test Type':       getTestType(t.title),
    'Priority':        getSeverity(t.title),
    'Preconditions':  'Application accessible at http://customerportal.dev-ts.online',
    'Test Steps':     '1. Navigate to page\n2. Perform action\n3. Verify result',
    'Test Data':      'Refer to test-data/' + feature.toLowerCase() + 'Data.js',
    'Expected Result':'Test should pass per acceptance criteria',
    'Actual Result':   status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
    'Status':          status,
    'Executed By':    'Claude QA Automation',
    'Execution Date':  today,
    'Environment':    'http://customerportal.dev-ts.online | Chrome | Windows',
    'Remarks':        isRegression ? `Regression — ${now}` : '',
  };
});

const tcSheet = XLSX.utils.json_to_sheet(tcRows.length ? tcRows : [{}], { header: TC_HEADER });
setColWidths(tcSheet, [14, 45, 14, 12, 10, 30, 42, 30, 38, 45, 8, 20, 14, 42, 28]);

// ── Sheet 2: Bug Report ───────────────────────────────────────────────────────
const failedTests = tests.filter(t => t.status === 'failed');

const bugRows = failedTests.map((t, i) => {
  const tcId   = t.title.match(/TC-[\w-]+/)?.[0]
                 || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const bugId  = `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}`;
  const sev    = getSeverity(t.title);

  if (isRegression) {
    const existing = existingBugRows.find(r => r['Linked TC ID'] === tcId);
    if (existing) return {
      ...existing,
      'Regression Status': 'Fail',
      'Remarks':           `Still failing — ${now}`,
    };
  }

  return {
    'Bug ID':             bugId,
    'Title':             `[FAIL] ${t.title}`,
    'Module':             feature,
    'Linked TC ID':       tcId,
    'Severity':           sev,
    'Priority':           getPriority(sev),
    'Environment':       'http://customerportal.dev-ts.online | Chrome | Windows',
    'Steps to Reproduce':'1. Navigate to feature page\n2. Execute test steps\n3. Observe failure',
    'Expected Result':   'Test should pass successfully',
    'Actual Result':      t.error || 'Test failed',
    'Status':            'New',
    'Reported By':       'Claude QA Automation',
    'Reported Date':      today,
    'Fixed Date':        '',
    'Regression Status':  isRegression ? 'Fail' : 'Not Run',
    'Remarks':           '',
  };
});

// Regression — mark fixed bugs
if (isRegression) {
  const passedIds = tests.filter(t => t.status === 'passed')
    .map(t => t.title.match(/TC-[\w-]+/)?.[0]).filter(Boolean);
  existingBugRows.forEach(bug => {
    if (passedIds.includes(bug['Linked TC ID'])) {
      bug['Regression Status'] = 'Pass';
      bug['Status']            = 'Fixed';
      bug['Fixed Date']        = today;
      bug['Remarks']           = `Fixed — verified in regression ${now}`;
    }
  });
}

const finalBugRows = isRegression
  ? [...existingBugRows,
     ...bugRows.filter(b => !existingBugRows.find(e => e['Linked TC ID'] === b['Linked TC ID']))]
  : bugRows;

const bugSheet = XLSX.utils.json_to_sheet(
  finalBugRows.length ? finalBugRows : [{}], { header: BUG_HEADER }
);
setColWidths(bugSheet, [18, 50, 14, 14, 10, 8, 42, 42, 35, 45, 12, 20, 14, 12, 16, 30]);

// ── Write to workbook ─────────────────────────────────────────────────────────
['Test Execution', 'Bug Report'].forEach(name => {
  if (wb.SheetNames.includes(name)) {
    wb.SheetNames.splice(wb.SheetNames.indexOf(name), 1);
    delete wb.Sheets[name];
  }
});
XLSX.utils.book_append_sheet(wb, tcSheet,  'Test Execution');
XLSX.utils.book_append_sheet(wb, bugSheet, 'Bug Report');
XLSX.writeFile(wb, reportPath);

const passed = tests.filter(t => t.status === 'passed').length;
const failed = tests.filter(t => t.status === 'failed').length;
const rate   = tests.length ? ((passed / tests.length) * 100).toFixed(1) : 0;
console.log(`✅ Feature report: ${reportPath}`);
console.log(`📊 ${feature} | Total:${tests.length} Pass:${passed} Fail:${failed} Rate:${rate}%`);
if (failed > 0) console.log(`🐛 ${failed} bug(s) logged in Bug Report sheet`);
