// utils/generate-daily-report.js
// Generates / appends to Daily Bug Report
// → Test Execution Report/Daily Reports/BugReport_DD-Mon-YYYY.xlsx
//
// Daily Bug Report — 18 canonical columns:
// Date | Module | TC ID | Test Case Name | Test Type | Priority | Status |
// Bug ID | Bug Title | Severity | Bug Priority | Environment | Browser | OS |
// Steps to Reproduce | Expected Result | Actual Result | Source Report
//
// Usage: node utils/generate-daily-report.js --feature=Login

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args       = process.argv.slice(2);
const featureArg = args.find(a => a.startsWith('--feature='));
const feature    = featureArg ? featureArg.split('=')[1] : 'Login';

const todayLabel  = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe    = todayLabel.replace(/ /g, '-');
const dailyDir    = path.join(__dirname, '../Test Execution Report/Daily Reports');
const dailyPath   = path.join(dailyDir, `BugReport_${fileSafe}.xlsx`);
const resultsFile = path.join(__dirname, '../reports/test-results.json');
const featureReport = `Test Execution Report\\Feature Reports\\${feature}.xlsx`;

// ── Canonical 18-column header ────────────────────────────────────────────────
const DAILY_HEADER = [
  'Date',                 // A
  'Module',               // B
  'TC ID',                // C
  'Test Case Name',       // D
  'Test Type',            // E
  'Priority',             // F
  'Status',               // G
  'Bug ID',               // H
  'Bug Title',            // I
  'Severity',             // J
  'Bug Priority',         // K
  'Environment',          // L
  'Browser',              // M
  'OS',                   // N
  'Steps to Reproduce',   // O
  'Expected Result',      // P
  'Actual Result',        // Q
  'Source Report',        // R
];

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
  if (/invalid|wrong|empty|rejected/i.test(title)) return 'Negative';
  return 'Positive';
}

function loadAllTests() {
  if (!fs.existsSync(resultsFile)) return [];
  const raw   = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const tests = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const r = t.results?.[0] || {};
        tests.push({
          title:  spec.title,
          status: r.status || 'unknown',
          error:  r.error?.message?.replace(/\n/g, ' ').substring(0, 200) || '',
        });
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return tests;
}

fs.mkdirSync(dailyDir, { recursive: true });

// Load existing daily report (append mode)
let wb;
let existingRows = [];
if (fs.existsSync(dailyPath)) {
  wb           = XLSX.readFile(dailyPath);
  const sheet  = wb.Sheets['Daily Bug Report'];
  existingRows = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
  console.log(`📋 Appending to existing daily report (${existingRows.length} existing rows)`);
} else {
  wb = XLSX.utils.book_new();
  console.log(`📋 Creating new daily report: ${dailyPath}`);
}

const allTests    = loadAllTests();
const failedTests = allTests.filter(t => t.status === 'failed');
const existingIds = new Set(existingRows.map(r => r['TC ID']));
let   bugCounter  = existingRows.filter(r => r['Bug ID'] && r['Bug ID'] !== '—').length + 1;

let newRows = [];

if (failedTests.length === 0) {
  // Clean run — one summary row per feature (if not already logged today)
  const alreadyLogged = existingRows.some(
    r => r['Module'] === feature && r['Status'] === 'ALL PASS'
  );
  if (!alreadyLogged) {
    newRows.push({
      'Date':               todayLabel,
      'Module':             feature,
      'TC ID':             `TC-${feature.toUpperCase()}-001 to TC-${feature.toUpperCase()}-${String(allTests.length).padStart(3,'0')}`,
      'Test Case Name':    `All ${allTests.length} ${feature} test cases`,
      'Test Type':         'Positive / Negative / Boundary / Security',
      'Priority':          'Critical — High — Medium',
      'Status':            'ALL PASS',
      'Bug ID':            '—',
      'Bug Title':         'No bugs found',
      'Severity':          '—',
      'Bug Priority':      '—',
      'Environment':       'http://customerportal.dev-ts.online',
      'Browser':           'Chrome',
      'OS':                'Windows',
      'Steps to Reproduce':'—',
      'Expected Result':   `All ${feature} tests pass`,
      'Actual Result':     `All ${allTests.length} test cases passed`,
      'Source Report':      featureReport,
    });
  }
} else {
  // FAILs — one row per failed TC
  failedTests.forEach((t, i) => {
    const tcId = t.title.match(/TC-[\w-]+/)?.[0]
                 || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
    if (existingIds.has(tcId)) return; // don't duplicate
    const sev   = getSeverity(t.title);
    const bugId = `BUG-${feature.toUpperCase()}-${String(bugCounter++).padStart(3,'0')}`;
    newRows.push({
      'Date':               todayLabel,
      'Module':             feature,
      'TC ID':              tcId,
      'Test Case Name':     t.title,
      'Test Type':          getTestType(t.title),
      'Priority':           sev,
      'Status':             'FAIL',
      'Bug ID':             bugId,
      'Bug Title':         `[FAIL] ${t.title}`,
      'Severity':           sev,
      'Bug Priority':       getPriority(sev),
      'Environment':       'http://customerportal.dev-ts.online',
      'Browser':           'Chrome',
      'OS':                'Windows',
      'Steps to Reproduce':'1. Navigate to feature page\n2. Execute test steps\n3. Observe failure',
      'Expected Result':   'Test should pass successfully',
      'Actual Result':      t.error || 'Test failed',
      'Source Report':      featureReport,
    });
  });
}

const allRows = [...existingRows, ...newRows];
const sheet   = XLSX.utils.json_to_sheet(allRows.length ? allRows : [{}], { header: DAILY_HEADER });
sheet['!cols'] = [
  {wch:14},{wch:16},{wch:18},{wch:44},{wch:12},{wch:10},{wch:12},
  {wch:20},{wch:44},{wch:10},{wch:12},{wch:36},{wch:10},{wch:10},
  {wch:40},{wch:32},{wch:44},{wch:36},
];

if (wb.SheetNames.includes('Daily Bug Report')) {
  wb.SheetNames.splice(wb.SheetNames.indexOf('Daily Bug Report'), 1);
  delete wb.Sheets['Daily Bug Report'];
}
XLSX.utils.book_append_sheet(wb, sheet, 'Daily Bug Report');
XLSX.writeFile(wb, dailyPath);

console.log(`✅ Daily report saved: ${dailyPath}`);
console.log(`📊 New rows added: ${newRows.length} | Total rows: ${allRows.length}`);
