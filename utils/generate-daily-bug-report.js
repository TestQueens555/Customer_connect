// utils/generate-daily-bug-report.js
// Generates Daily Bug Report from test-results.json
// → Test Execution Report/Daily Reports/BugReport_DD-Mon-YYYY.xlsx
//
// Daily Bug Report — same 18 canonical columns as generate-daily-report.js:
// Date | Module | TC ID | Test Case Name | Test Type | Priority | Status |
// Bug ID | Bug Title | Severity | Bug Priority | Environment | Browser | OS |
// Steps to Reproduce | Expected Result | Actual Result | Source Report
//
// Optional tracker comparison: --tracker=filename.xlsx
// Usage: node utils/generate-daily-bug-report.js [--tracker=file.xlsx]

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const args        = process.argv.slice(2);
const trackerArg  = args.find(a => a.startsWith('--tracker='));
const OUTPUT_DIR  = path.join(__dirname, '../Test Execution Report/Daily Reports');
const TRACKER_DIR = path.join(OUTPUT_DIR, 'tracker-uploads');
const RESULTS_FILE = path.join(__dirname, '../reports/test-results.json');

const trackerFile = trackerArg
  ? path.join(TRACKER_DIR, trackerArg.split('=')[1])
  : null;

const todayLabel = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe   = todayLabel.replace(/ /g, '-');
const reportPath = path.join(OUTPUT_DIR, `BugReport_${fileSafe}.xlsx`);

// ── Canonical 19-column header (added Layer col) ─────────────────────────────
const DAILY_HEADER = [
  'Date',                 // A
  'Feature',              // B  (renamed from Module for consistency)
  'TC ID',                // C
  'Test Case Name',       // D
  'Test Type',            // E
  'Layer',                // F  ← Unit | API | Auto
  'Priority',             // G
  'Status',               // H
  'Bug ID',               // I
  'Bug Title',            // J
  'Severity',             // K
  'Bug Priority',         // L
  'Environment',          // M
  'Browser',              // N
  'OS',                   // O
  'Steps to Reproduce',   // P
  'Expected Result',      // Q
  'Actual Result',        // R
  'Source Report',        // S
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
function getLayer(title) {
  if (/empty|whitespace|masked|default|checkbox|toggle|type.*password|password.*type/i.test(title))
    return 'Unit';
  if (/redirect|page load|navigate|unauthenticated|visible|dashboard|tab|badge|search|profile/i.test(title))
    return 'Auto';
  return 'API';
}
// Strip ANSI escape codes from Playwright error messages
function cleanError(msg) {
  return (msg || '').replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').substring(0, 300).trim();
}
function getTestType(title) {
  if (/sql|xss|injection|unauthenticated|security/i.test(title)) return 'Security';
  if (/boundary|max|256|length|special|whitespace|case.insensitive/i.test(title)) return 'Boundary';
  if (/invalid|wrong|empty|rejected/i.test(title)) return 'Negative';
  return 'Positive';
}

function loadResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.warn('⚠ test-results.json not found — generating empty report');
    return { suites: [] };
  }
  return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
}

function extractFailedTests(raw) {
  const failed = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const r = t.results?.[0] || {};
        if (r.status === 'failed') {
          failed.push({
            title:   spec.title,
            suite:   suite.title,
            error:   cleanError(r.error?.message || '') || 'Test failed',
          });
        }
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return failed;
}

// ── Tracker comparison helpers ────────────────────────────────────────────────
function loadTracker(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const lines   = fs.readFileSync(filePath,'utf-8').split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.split(','), obj = {};
      headers.forEach((h,i) => { obj[h] = (vals[i]||'').trim(); });
      return obj;
    });
  }
  const wb   = XLSX.readFile(filePath);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
  return rows.map(r => {
    const norm = {};
    Object.keys(r).forEach(k => { norm[k.toLowerCase().trim()] = String(r[k]).trim(); });
    return norm;
  });
}

function findCol(row, keywords) {
  const keys = Object.keys(row);
  for (const kw of keywords) {
    const found = keys.find(k => k.includes(kw));
    if (found) return row[found];
  }
  return '';
}

function matchTracker(bug, trackerRows) {
  for (const tr of trackerRows) {
    const trId     = findCol(tr, ['bug id','issue id','id','key']);
    const trTitle  = findCol(tr, ['title','summary','name','description']);
    const trStatus = findCol(tr, ['status','state','resolution']);
    const trModule = findCol(tr, ['module','feature','component']);
    const trTcId   = findCol(tr, ['tc id','test case','linked tc']);

    if (trId && trId.toLowerCase() === bug.bugId.toLowerCase())
      return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
    if (trTcId && trTcId === bug.tcId && trModule &&
        trModule.toLowerCase() === bug.feature.toLowerCase())
      return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
    if (trTitle) {
      const bw  = bug.title.toLowerCase().split(/\W+/).filter(Boolean);
      const tw  = trTitle.toLowerCase().split(/\W+/).filter(Boolean);
      if (bw.filter(w => tw.includes(w)).length / (bw.length || 1) >= 0.7)
        return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
    }
  }
  return { exists:'No', trackerId:'', trackerStatus:'' };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw         = loadResults();
const failedTests = extractFailedTests(raw);
const trackerRows = trackerFile ? loadTracker(trackerFile) : [];

fs.mkdirSync(OUTPUT_DIR,  { recursive: true });
fs.mkdirSync(TRACKER_DIR, { recursive: true });

// Load existing file if it exists (append mode)
let wb;
let existingRows = [];
if (fs.existsSync(reportPath)) {
  wb           = XLSX.readFile(reportPath);
  const sheet  = wb.Sheets['Daily Bug Report'];
  existingRows = sheet ? XLSX.utils.sheet_to_json(sheet) : [];
  console.log(`📋 Appending (${existingRows.length} existing rows)`);
} else {
  wb = XLSX.utils.book_new();
}

const existingIds = new Set(existingRows.map(r => r['TC ID']));
let   bugCounter  = existingRows.filter(r => r['Bug ID'] && r['Bug ID'] !== '—').length + 1;
const newRows     = [];

failedTests.forEach((t, i) => {
  const tcId    = t.title.match(/TC-[\w-]+/)?.[0]
                  || `TC-${String(i+1).padStart(3,'0')}`;
  if (existingIds.has(tcId)) return;

  const feature  = t.suite || 'General';
  const bugId    = `BUG-${feature.toUpperCase().replace(/\s+/g,'-')}-${String(bugCounter++).padStart(3,'0')}`;
  const sev      = getSeverity(t.title);
  const tracker  = matchTracker({ bugId, tcId, title:t.title, feature }, trackerRows);

  // Remarks: include tracker info if available
  const remarks  = tracker.exists === 'Yes'
    ? `Matched in tracker: ${tracker.trackerId} (${tracker.trackerStatus})`
    : 'New — not yet in tracker';

  newRows.push({
    'Date':               todayLabel,
    'Feature':            feature,
    'TC ID':              tcId,
    'Test Case Name':     t.title,
    'Test Type':          getTestType(t.title),
    'Layer':              getLayer(t.title),
    'Priority':           sev,
    'Status':             'FAIL',
    'Bug ID':             bugId,
    'Bug Title':         `[FAIL] ${t.title}`,
    'Severity':           sev,
    'Bug Priority':       getPriority(sev),
    'Environment':       'http://customerportal.dev-ts.online',
    'Browser':           'Chrome',
    'OS':                'Windows',
    'Steps to Reproduce':`See spec: tests/${feature.toLowerCase()}.spec.js  TC: ${tcId}`,
    'Expected Result':   'All Playwright assertions pass',
    'Actual Result':      t.error || 'Playwright test failed',
    'Source Report':     `Test Execution Report\\Feature Reports\\${feature}.xlsx`,
  });
});

const allRows = [...existingRows, ...newRows];
const sheet   = XLSX.utils.json_to_sheet(allRows.length ? allRows : [{}], { header: DAILY_HEADER });
sheet['!cols'] = [
  {wch:13},{wch:14},{wch:22},{wch:44},{wch:11},{wch:10},{wch:10},{wch:8},
  {wch:20},{wch:46},{wch:10},{wch:10},{wch:36},{wch:9},{wch:9},
  {wch:44},{wch:36},{wch:50},{wch:40},
];

if (wb.SheetNames.includes('Daily Bug Report')) {
  wb.SheetNames.splice(wb.SheetNames.indexOf('Daily Bug Report'), 1);
  delete wb.Sheets['Daily Bug Report'];
}
XLSX.utils.book_append_sheet(wb, sheet, 'Daily Bug Report');
XLSX.writeFile(wb, reportPath);

console.log(`✅ Daily Bug Report: ${reportPath}`);
console.log(`🐛 Total FAILs: ${failedTests.length} | New rows: ${newRows.length}`);
if (trackerFile) console.log(`📂 Tracker: ${path.basename(trackerFile)}`);
