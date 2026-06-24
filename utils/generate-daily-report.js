// utils/generate-daily-report.js
// Appends bugs to → Test Execution Report/Daily Reports/DailyBugReport_YYYY-MM-DD.xlsx
// Usage: node utils/generate-daily-report.js --feature=Login

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args       = process.argv.slice(2);
const featureArg = args.find(a => a.startsWith('--feature='));
const feature    = featureArg ? featureArg.split('=')[1] : 'Login';
const today      = new Date().toISOString().slice(0, 10);
const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dailyDir   = path.join(__dirname, '../Test Execution Report/Daily Reports');
const dailyPath  = path.join(dailyDir, `DailyBugReport_${today}.xlsx`);
const resultsFile = path.join(__dirname, '../reports/test-results.json');

const bugHeader = ['Date','Bug ID','Feature / Module','Linked TC ID','Title',
  'Severity','Priority','Status','Environment','Steps to Reproduce',
  'Expected Result','Actual Result','Reported By','Screenshot / Evidence','Remarks'];

function getSeverity(title) {
  if (/TC-.*-001|valid login|page load/i.test(title)) return 'Critical';
  if (/invalid|wrong|empty|sql|xss|security/i.test(title)) return 'High';
  if (/boundary|max|256|length/i.test(title)) return 'Medium';
  return 'Low';
}

function getPriority(s) {
  return { Critical: 'P1', High: 'P2', Medium: 'P3', Low: 'P3' }[s] || 'P3';
}

function loadFailedTests() {
  if (!fs.existsSync(resultsFile)) return [];
  const raw = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const tests = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const result = t.results?.[0] || {};
        if (result.status === 'failed') {
          tests.push({
            title: spec.title,
            error: result.error?.message?.replace(/\n/g, ' ').substring(0, 200) || 'Test failed',
          });
        }
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return tests;
}

fs.mkdirSync(dailyDir, { recursive: true });

// Load existing daily report if exists (append mode)
let wb;
let existingRows = [];
if (fs.existsSync(dailyPath)) {
  wb = XLSX.readFile(dailyPath);
  const sheet = wb.Sheets['Daily Bug Report'];
  existingRows = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
  console.log(`📋 Appending to existing daily report (${existingRows.length} existing rows)`);
} else {
  wb = XLSX.utils.book_new();
  console.log(`📋 Creating new daily report: ${dailyPath}`);
}

const existingBugIds = new Set(existingRows.map(r => r['Bug ID']));
let bugCounter       = existingRows.filter(r => r['Bug ID']?.startsWith('BUG-')).length + 1;
const failedTests    = loadFailedTests();
const now            = new Date().toLocaleString();

let newRows = [];

if (failedTests.length === 0) {
  // No bugs — add clean run note (only if not already noted for this feature today)
  const alreadyNoted = existingRows.some(r => r['Feature / Module'] === feature && r['Title'] === 'No bugs found');
  if (!alreadyNoted) {
    newRows.push({
      'Date':                todayLabel,
      'Bug ID':             `INFO-${feature.toUpperCase()}-${today}`,
      'Feature / Module':    feature,
      'Linked TC ID':       'ALL',
      'Title':              'No bugs found',
      'Severity':           '-',
      'Priority':           '-',
      'Status':             'Closed',
      'Environment':        'http://customerportal.dev-ts.online | Chrome | Ubuntu',
      'Steps to Reproduce': '-',
      'Expected Result':    'All tests pass',
      'Actual Result':      `All ${feature} tests passed`,
      'Reported By':        'Automation (Playwright)',
      'Screenshot / Evidence': '-',
      'Remarks':            `Clean run — ${now}`,
    });
  }
} else {
  newRows = failedTests.map((t, i) => {
    const tcId  = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${feature.toUpperCase()}-${String(i+1).padStart(3,'0')}`;
    const bugId = `BUG-${feature.toUpperCase()}-${String(bugCounter+i).padStart(3,'0')}`;
    if (existingBugIds.has(bugId)) return null;
    const sev = getSeverity(t.title);
    return {
      'Date':                todayLabel,
      'Bug ID':              bugId,
      'Feature / Module':    feature,
      'Linked TC ID':        tcId,
      'Title':              `[FAIL] ${t.title}`,
      'Severity':            sev,
      'Priority':            getPriority(sev),
      'Status':             'New',
      'Environment':        'http://customerportal.dev-ts.online | Chrome | Ubuntu',
      'Steps to Reproduce': '1. Navigate\n2. Execute test\n3. Observe failure',
      'Expected Result':    'Test should pass',
      'Actual Result':       t.error,
      'Reported By':        'Automation (Playwright)',
      'Screenshot / Evidence': `reports/screenshots/${tcId}-failure.png`,
      'Remarks':            '',
    };
  }).filter(Boolean);
}

const allRows = [...existingRows, ...newRows];
const sheet   = XLSX.utils.json_to_sheet(allRows.length ? allRows : [{}], { header: bugHeader });
sheet['!cols'] = [{wch:14},{wch:22},{wch:16},{wch:14},{wch:50},{wch:10},{wch:8},
  {wch:12},{wch:40},{wch:40},{wch:35},{wch:45},{wch:22},{wch:35},{wch:30}];

if (wb.SheetNames.includes('Daily Bug Report')) {
  wb.SheetNames.splice(wb.SheetNames.indexOf('Daily Bug Report'),1);
  delete wb.Sheets['Daily Bug Report'];
}
XLSX.utils.book_append_sheet(wb, sheet, 'Daily Bug Report');
XLSX.writeFile(wb, dailyPath);

const bugCount = allRows.filter(r => r['Bug ID']?.startsWith('BUG-')).length;
console.log(`✅ Daily report saved: ${dailyPath}`);
console.log(`📊 Total bugs today: ${bugCount} | New rows added: ${newRows.length}`);
