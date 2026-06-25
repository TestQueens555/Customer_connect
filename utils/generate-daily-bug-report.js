// utils/generate-daily-bug-report.js
// Generates a daily bug report Excel file with tracker comparison support.
//
// Usage:
//   node utils/generate-daily-bug-report.js
//   node utils/generate-daily-bug-report.js --tracker=tracker_upload.xlsx

const XLSX   = require('xlsx');
const fs     = require('fs');
const path   = require('path');
const args   = process.argv.slice(2);

// ── PATHS ──────────────────────────────────────────────────────────
const OUTPUT_DIR   = path.join(__dirname, '../Daily Bug Report');
const TRACKER_DIR  = path.join(OUTPUT_DIR, 'tracker-uploads');
const RESULTS_FILE = path.join(__dirname, '../reports/test-results.json');

const trackerArg  = args.find(a => a.startsWith('--tracker='));
const trackerFile = trackerArg ? path.join(TRACKER_DIR, trackerArg.split('=')[1]) : null;

// ── Date ───────────────────────────────────────────────────────────
const today    = new Date();
const dateStr  = today.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe = dateStr.replace(/ /g, '-');
const reportPath = path.join(OUTPUT_DIR, `BugReport_${fileSafe}.xlsx`);

// ── Load Playwright test results ────────────────────────────────────
function loadResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.warn('⚠️  test-results.json not found — generating empty bug report.');
    return { suites: [] };
  }
  return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
}

// ── Extract failed tests ────────────────────────────────────────────
function extractFailedTests(raw) {
  const failed = [];
  function extract(suite) {
    (suite.specs || []).forEach(spec => {
      spec.tests.forEach(t => {
        const result = t.results?.[0] || {};
        if (result.status === 'failed') {
          failed.push({
            title:  spec.title,
            suite:  suite.title,
            error:  result.error?.message || 'Test failed',
          });
        }
      });
    });
    (suite.suites || []).forEach(extract);
  }
  (raw.suites || []).forEach(extract);
  return failed;
}

// ── Severity / Priority ─────────────────────────────────────────────
function getSeverity(title) {
  if (/valid login|TC-.*-001/i.test(title)) return 'Critical';
  if (/invalid|wrong|empty/i.test(title))   return 'High';
  if (/boundary|sql|xss|long/i.test(title)) return 'Medium';
  return 'Low';
}
function getPriority(s) {
  return { Critical:'P1', High:'P2', Medium:'P3', Low:'P3' }[s] || 'P3';
}

// ── Load tracker file ───────────────────────────────────────────────
function loadTracker(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const ext  = path.extname(filePath).toLowerCase();
  let rows   = [];

  if (ext === '.csv') {
    const lines   = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    });
  } else {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows     = XLSX.utils.sheet_to_json(ws, { defval: '' });
    rows     = rows.map(r => {
      const norm = {};
      Object.keys(r).forEach(k => { norm[k.toLowerCase().trim()] = String(r[k]).trim(); });
      return norm;
    });
  }

  console.log(`📂 Tracker loaded: ${rows.length} rows from ${path.basename(filePath)}`);
  return rows;
}

// ── Find column value by keyword ────────────────────────────────────
function findCol(row, keywords) {
  const keys = Object.keys(row);
  for (const kw of keywords) {
    const found = keys.find(k => k.includes(kw));
    if (found) return row[found];
  }
  return '';
}

// ── Match bug against tracker ───────────────────────────────────────
function matchTracker(bug, trackerRows) {
  for (const tr of trackerRows) {
    const trId     = findCol(tr, ['bug id','issue id','id','key','bug']);
    const trTitle  = findCol(tr, ['title','summary','name','description','subject']);
    const trStatus = findCol(tr, ['status','state','resolution']);
    const trModule = findCol(tr, ['module','feature','component','area']);
    const trTcId   = findCol(tr, ['tc id','test case','linked tc','tc']);

    // Rule 1: Bug ID exact match
    if (trId && trId.toLowerCase() === bug.bugId.toLowerCase()) {
      return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
    }
    // Rule 2: TC ID + Module match
    if (trTcId && trTcId === bug.tcId && trModule &&
        trModule.toLowerCase() === bug.feature.toLowerCase()) {
      return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
    }
    // Rule 3: Title similarity >= 70%
    if (trTitle) {
      const bugWords     = bug.title.toLowerCase().split(/\W+/).filter(Boolean);
      const trackerWords = trTitle.toLowerCase().split(/\W+/).filter(Boolean);
      const matches      = bugWords.filter(w => trackerWords.includes(w)).length;
      if (bugWords.length && (matches / bugWords.length) >= 0.7) {
        return { exists:'Yes', trackerId:trId, trackerStatus:trStatus };
      }
    }
  }
  return { exists:'No', trackerId:'', trackerStatus:'' };
}

// ── MAIN ────────────────────────────────────────────────────────────
function generateDailyBugReport() {
  const raw         = loadResults();
  const failedTests = extractFailedTests(raw);
  const trackerRows = trackerFile ? loadTracker(trackerFile) : [];

  const bugHeader = [
    'Bug ID', 'Title', 'Module / Feature', 'Linked TC ID',
    'Severity', 'Priority', 'Environment',
    'Steps to Reproduce', 'Expected Result', 'Actual Result',
    'Status', 'Reported Date', 'Reporter',
    'Screenshot / Evidence',
    'Bug Exists in Tracker', 'Tracker Bug ID', 'Tracker Status',
    'Remarks'
  ];

  const bugRows = failedTests.map((t, i) => {
    const tcId    = t.title.match(/TC-[\w-]+/)?.[0] || `TC-${String(i+1).padStart(3,'0')}`;
    const feature = t.suite || 'General';
    const bugId   = `BUG-${feature.toUpperCase().replace(/\s+/g,'-')}-${String(i+1).padStart(3,'0')}`;
    const sev     = getSeverity(t.title);
    const tracker = matchTracker({ bugId, tcId, title:t.title, feature }, trackerRows);

    return {
      'Bug ID':                bugId,
      'Title':                 t.title,
      'Module / Feature':      feature,
      'Linked TC ID':          tcId,
      'Severity':              sev,
      'Priority':              getPriority(sev),
      'Environment':           'http://customerportal.dev-ts.online | Chrome | Windows',
      'Steps to Reproduce':    '1. Navigate to page\n2. Execute test steps\n3. Observe failure',
      'Expected Result':       'Test should pass successfully',
      'Actual Result':         t.error || 'Test failed',
      'Status':                'New',
      'Reported Date':         dateStr,
      'Reporter':              'QA Automation',
      'Screenshot / Evidence': `C:\\Users\\Turbosoft PC\\OneDrive\\Pictures\\Screenshots 1\\${tcId}-failure.png`,
      'Bug Exists in Tracker': tracker.exists,
      'Tracker Bug ID':        tracker.trackerId,
      'Tracker Status':        tracker.trackerStatus,
      'Remarks':               tracker.exists === 'Yes'
                                 ? `Matched in tracker: ${tracker.trackerId}`
                                 : 'New bug — not yet in tracker',
    };
  });

  // ── Build workbook ─────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(bugRows.length ? bugRows : [{}], { header: bugHeader });

  ws['!cols'] = [
    {wch:18},{wch:50},{wch:18},{wch:14},{wch:10},{wch:8},
    {wch:40},{wch:45},{wch:35},{wch:45},
    {wch:14},{wch:14},{wch:16},{wch:45},
    {wch:22},{wch:16},{wch:16},{wch:35}
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bug Report');

  // ── Save ────────────────────────────────────────────────────────────
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(TRACKER_DIR, { recursive: true });
  XLSX.writeFile(wb, reportPath);

  // ── Summary ─────────────────────────────────────────────────────────
  const inTracker  = bugRows.filter(r => r['Bug Exists in Tracker'] === 'Yes').length;
  const notTracked = bugRows.filter(r => r['Bug Exists in Tracker'] === 'No').length;

  console.log(`\n✅ Daily Bug Report saved to : ${reportPath}`);
  console.log(`📅 Date                      : ${dateStr}`);
  console.log(`🐛 Total bugs                : ${bugRows.length}`);
  console.log(`✅ Already in tracker        : ${inTracker}`);
  console.log(`🆕 New bugs (not in tracker) : ${notTracked}`);
  if (trackerFile) {
    console.log(`📂 Tracker file used         : ${path.basename(trackerFile)}`);
  } else {
    console.log(`📂 Tracker                   : No tracker file — run with --tracker=file.xlsx to compare`);
  }
}

generateDailyBugReport();
