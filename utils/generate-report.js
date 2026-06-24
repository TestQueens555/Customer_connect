// utils/generate-report.js
// Generates Feature-wise Excel report → Test Execution Report/Feature Reports/[Feature].xlsx
// Usage: node utils/generate-report.js --feature=Login
// Usage: node utils/generate-report.js --feature=Login --regression

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args        = process.argv.slice(2);
const featureArg  = args.find(a => a.startsWith('--feature='));
const isRegression = args.includes('--regression');
const feature     = featureArg ? featureArg.split('=')[1] : 'Login';
const reportDir   = path.join(__dirname, '../Test Execution Report/Feature Reports');
const reportPath  = path.join(reportDir, `${feature}.xlsx`);
const resultsFile = path.join(__dirname, '../reports/test-results.json');
const today       = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function loadResults() {
  if (!fs.existsSync(resultsFile)) {
    console.warn('⚠ test-results.json not found — generating empty report');
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
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
          error:    result.error?.message?.replace(/\n/g, ' ').substring(0, 200) || '',
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
  if (/invalid|wrong|empty|sql|xss|security/i.test(title)) return 'High';
  if (/boundary|max|length|256/i.test(title)) return 'Medium';
  return 'Low';
}

function getPriority(s) {
  return { Critical: 'P1', High: 'P2', Medium: 'P3', Low: 'P3' }[s] || 'P3';
}

function getTestType(title) {
  if (/sql|xss|injection|security/i.test(title)) return 'Security';
  if (/boundary|max|256|length|empty/i.test(title)) return 'Boundary';
  if (/invalid|wrong|fail|blocked|rejected/i.test(title)) return 'Negative';
  if (/page load|ui|visible|mask/i.test(title)) return 'UI';
  return 'Positive';
}

fs.mkdirSync(reportDir, { recursive: true });

const tests = loadResults();
const now   = new Date().toLocaleString();

let wb;
let existingTCRows  = [];
let existingBugRows = [];
let bugCounter      = 1;

if (isRegression && fs.existsSync(reportPath)) {
  console.log(`🔄 Regression mode — updating: ${reportPath}`);
  wb = XLSX.readFile(reportPath);
  const tcSheet  = wb.Sheets['Test Execution'];
  const bugSheet = wb.Sheets['Bug Report'];
  existingTCRows  = tcSheet  ? XLSX.utils.sheet_to_json(tcSheet)  : [];
  existingBugRows = bugSheet ? XLSX.utils.sheet_to_json(bugSheet) : [];
  bugCounter      = existingBugRows.length + 1;
} else {
  wb = XLSX.utils.book_new();
}

// ── Sheet 1: Test Execution ────────────────────────────────────────────
const tcHeader = ['Test Case ID','Test Case Name','Module / Feature','Test Type',
  'Priority','Preconditions','Test Steps','Test Data','Expected Result',
  'Actual Result','Status','Executed By','Execution Date','Defect ID','Remarks'];

const tcRows = tests.map((t, i) => {
  const tcId     = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const status   = mapStatus(t.status);
  const severity = getSeverity(t.title);
  const defectId = status === 'FAIL' ? `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}` : '';

  if (isRegression) {
    const existing = existingTCRows.find(r => r['Test Case ID'] === tcId);
    if (existing) return {
      ...existing,
      'Actual Result':  status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
      'Status':          status,
      'Execution Date':  today,
      'Executed By':    'Automation (Playwright)',
      'Defect ID':       defectId || existing['Defect ID'],
      'Remarks':        `Regression — ${now}`,
    };
  }

  return {
    'Test Case ID':      tcId,
    'Test Case Name':    t.title,
    'Module / Feature':  feature,
    'Test Type':         getTestType(t.title),
    'Priority':          severity,
    'Preconditions':    `Application accessible at http://customerportal.dev-ts.online`,
    'Test Steps':       '1. Navigate to page\n2. Perform action\n3. Verify result',
    'Test Data':        'Username: sajith_xyz | Password: User@123',
    'Expected Result':  'Test should pass per acceptance criteria',
    'Actual Result':     status === 'PASS' ? 'Test passed successfully' : (t.error || 'Test failed'),
    'Status':            status,
    'Executed By':      'Automation (Playwright)',
    'Execution Date':    today,
    'Defect ID':         defectId,
    'Remarks':           isRegression ? `Regression — ${now}` : '',
  };
});

const tcSheet = XLSX.utils.json_to_sheet(tcRows.length ? tcRows : [{}], { header: tcHeader });
tcSheet['!cols'] = [{wch:14},{wch:45},{wch:14},{wch:14},{wch:10},{wch:30},{wch:40},
  {wch:30},{wch:35},{wch:45},{wch:10},{wch:22},{wch:14},{wch:14},{wch:25}];

// ── Sheet 2: Bug Report ────────────────────────────────────────────────
const bugHeader = ['Bug ID','Title','Module / Feature','Linked TC ID','Severity','Priority',
  'Environment','Steps to Reproduce','Expected Result','Actual Result',
  'Status','Reported Date','Fixed Date','Regression Status','Screenshot / Evidence','Remarks'];

const failedTests  = tests.filter(t => t.status === 'failed');
const bugRows = failedTests.map((t, i) => {
  const tcId    = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
  const bugId   = `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}`;
  const severity = getSeverity(t.title);
  if (isRegression) {
    const existing = existingBugRows.find(r => r['Linked TC ID'] === tcId);
    if (existing) return { ...existing, 'Regression Status': 'Fail', 'Remarks': `Still failing — ${now}` };
  }
  return {
    'Bug ID':               bugId,
    'Title':               `[FAIL] ${t.title}`,
    'Module / Feature':    feature,
    'Linked TC ID':        tcId,
    'Severity':            severity,
    'Priority':            getPriority(severity),
    'Environment':        'http://customerportal.dev-ts.online | Chrome | Ubuntu',
    'Steps to Reproduce': '1. Navigate\n2. Execute test steps\n3. Observe failure',
    'Expected Result':    'Test should pass',
    'Actual Result':       t.error || 'Test failed',
    'Status':             'New',
    'Reported Date':       today,
    'Fixed Date':         '',
    'Regression Status':   isRegression ? 'Fail' : 'Not Run',
    'Screenshot / Evidence': `reports/screenshots/${tcId}-failure.png`,
    'Remarks':            '',
  };
});

// In regression — mark fixed bugs
if (isRegression) {
  const passedIds = tests.filter(t => t.status === 'passed').map(t => t.title.match(/TC-[\w-]+/)?.[0]).filter(Boolean);
  existingBugRows.forEach(bug => {
    if (passedIds.includes(bug['Linked TC ID'])) {
      bug['Regression Status'] = 'Pass';
      bug['Status']            = 'Fixed';
      bug['Fixed Date']        = today;
      bug['Remarks']           = `Fixed — verified ${now}`;
    }
  });
}

const finalBugRows = isRegression
  ? [...existingBugRows, ...bugRows.filter(b => !existingBugRows.find(e => e['Linked TC ID'] === b['Linked TC ID']))]
  : bugRows;

const bugSheet = XLSX.utils.json_to_sheet(finalBugRows.length ? finalBugRows : [{}], { header: bugHeader });
bugSheet['!cols'] = [{wch:18},{wch:50},{wch:14},{wch:14},{wch:10},{wch:8},{wch:42},
  {wch:40},{wch:35},{wch:45},{wch:12},{wch:14},{wch:12},{wch:16},{wch:35},{wch:30}];

// Write sheets
['Test Execution','Bug Report'].forEach(name => {
  if (wb.SheetNames.includes(name)) { wb.SheetNames.splice(wb.SheetNames.indexOf(name),1); delete wb.Sheets[name]; }
});
XLSX.utils.book_append_sheet(wb, tcSheet, 'Test Execution');
XLSX.utils.book_append_sheet(wb, bugSheet, 'Bug Report');
XLSX.writeFile(wb, reportPath);

const passed  = tests.filter(t => t.status === 'passed').length;
const failed  = tests.filter(t => t.status === 'failed').length;
const rate    = tests.length ? ((passed/tests.length)*100).toFixed(1) : 0;
console.log(`✅ Feature report saved: ${reportPath}`);
console.log(`📊 ${feature} | Total:${tests.length} Pass:${passed} Fail:${failed} Rate:${rate}%`);
if (failed > 0) console.log(`🐛 ${failed} bug(s) logged`);
