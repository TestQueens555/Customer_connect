---
name: daily-bug-report
description: >
  Generate a daily bug report Excel file for the CustomerConnect project.
  Each report is named by date (BugReport_DD-MMM-YYYY.xlsx) and saved to:
  D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\
  Also supports comparing the daily bug report against an externally uploaded
  tracker file (Jira, Excel, CSV) to check if bugs already exist in the tracker.
  Adds three extra columns to the report:
    - Bug Exists in Tracker (Yes / No)
    - Tracker Bug ID        (e.g. JIRA-1023)
    - Tracker Status        (e.g. Open / In Progress / Fixed / Closed)
  Trigger this skill whenever the user says "daily bug report", "generate bug report",
  "create today's bug report", "compare with tracker", "upload tracker file",
  "check tracker", "match bugs", or "bug exists in tracker".
---

# Daily Bug Report Skill

You are a **QA Bug Tracking Engineer** for the CustomerConnect project.
You generate daily bug reports as Excel files and optionally compare them
against an external tracker file uploaded by the user.

---

## Output Folder

```
D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\
├── BugReport_23-Jun-2026.xlsx       ← Today's bug report
├── BugReport_22-Jun-2026.xlsx       ← Yesterday's bug report
├── BugReport_21-Jun-2026.xlsx       ← ...
└── tracker-uploads\                 ← User drops external tracker files here
    └── tracker_upload.xlsx          ← Latest uploaded tracker file
```

---

## Daily Bug Report — Excel Structure

### One sheet: "Bug Report" — Columns

| Col | Field                  | Example                                      |
|-----|------------------------|----------------------------------------------|
| A   | Bug ID                 | BUG-LOGIN-001                                |
| B   | Title                  | Login fails with valid credentials            |
| C   | Module / Feature       | Login                                        |
| D   | Linked TC ID           | TC-LOGIN-001                                 |
| E   | Severity               | Critical / High / Medium / Low               |
| F   | Priority               | P1 / P2 / P3                                 |
| G   | Environment            | http://customerportal.dev-ts.online / Chrome |
| H   | Steps to Reproduce     | Step-by-step                                 |
| I   | Expected Result        | User redirected to dashboard                 |
| J   | Actual Result          | Error shown despite correct credentials      |
| K   | Status                 | New / In Progress / Fixed / Verified / Closed|
| L   | Reported Date          | 23-Jun-2026                                  |
| M   | Reporter               | QA Automation                                |
| N   | Screenshot / Evidence  | Path or filename                             |
| O   | Bug Exists in Tracker  | Yes / No                                     |
| P   | Tracker Bug ID         | JIRA-1023 (blank if No)                      |
| Q   | Tracker Status         | Open / In Progress / Fixed / Closed (blank if No) |
| R   | Remarks                | Any notes                                    |

---

## Tracker Comparison Rules

When the user uploads an external tracker file, apply these rules:

### Matching Logic
Match bugs from the daily report against the tracker using ANY of:
1. **Bug ID exact match**        — BUG-LOGIN-001 == BUG-LOGIN-001
2. **Title similarity**          — if >70% of words match (case-insensitive)
3. **Module + TC ID match**      — same Module AND same Linked TC ID

### If match found:
- Set **Bug Exists in Tracker** = `Yes`
- Set **Tracker Bug ID**         = tracker's bug/issue ID
- Set **Tracker Status**         = tracker's current status

### If no match found:
- Set **Bug Exists in Tracker** = `No`
- Leave **Tracker Bug ID** and **Tracker Status** blank

### Tracker File — Accepted Formats
| Format | Notes |
|--------|-------|
| .xlsx  | Read with openpyxl / xlsx library |
| .xls   | Read with xlrd |
| .csv   | Read with csv module |

### Tracker File — Expected Columns (flexible — auto-detect)
The tracker file may come from Jira export, TestRail, Azure DevOps, or manual Excel.
Auto-detect columns by looking for headers containing these keywords (case-insensitive):

| Keyword to look for  | Maps to field          |
|---------------------|------------------------|
| id, issue, bug id   | Tracker Bug ID         |
| title, summary, name, description | Bug title |
| status, state       | Tracker Status         |
| module, feature, component | Module          |
| tc, test case, linked | Linked TC ID         |

---

## Script — generate-daily-bug-report.js

```javascript
// utils/generate-daily-bug-report.js
// Usage: node utils/generate-daily-bug-report.js
// Usage: node utils/generate-daily-bug-report.js --tracker=tracker_upload.xlsx

const XLSX    = require('xlsx');
const fs      = require('fs');
const path    = require('path');
const args    = process.argv.slice(2);

// ── PATHS ─────────────────────────────────────────────────────────
const OUTPUT_DIR     = path.join(__dirname, '../Daily Bug Report');
const TRACKER_DIR    = path.join(OUTPUT_DIR, 'tracker-uploads');
const RESULTS_FILE   = path.join(__dirname, '../reports/test-results.json');

const trackerArg     = args.find(a => a.startsWith('--tracker='));
const trackerFile    = trackerArg
  ? path.join(TRACKER_DIR, trackerArg.split('=')[1])
  : null;

// ── Date helpers ──────────────────────────────────────────────────
const today    = new Date();
const dateStr  = today.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe = dateStr.replace(/ /g, '-');         // 23-Jun-2026
const reportPath = path.join(OUTPUT_DIR, `BugReport_${fileSafe}.xlsx`);

// ── Load Playwright test results ──────────────────────────────────
function loadResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.warn('⚠️  test-results.json not found — generating empty bug report.');
    return { suites: [] };
  }
  return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
}

// ── Flatten failed tests from Playwright JSON ─────────────────────
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

// ── Severity / Priority helpers ────────────────────────────────────
function getSeverity(title) {
  if (/valid login|TC-.*-001/i.test(title)) return 'Critical';
  if (/invalid|wrong|empty/i.test(title))   return 'High';
  if (/boundary|sql|xss|long/i.test(title)) return 'Medium';
  return 'Low';
}
function getPriority(s) {
  return { Critical:'P1', High:'P2', Medium:'P3', Low:'P3' }[s] || 'P3';
}

// ── Load tracker file and build lookup rows ────────────────────────
function loadTracker(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const ext = path.extname(filePath).toLowerCase();
  let rows = [];

  if (ext === '.csv') {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    });
  } else {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    // normalise keys to lowercase
    rows = rows.map(r => {
      const norm = {};
      Object.keys(r).forEach(k => { norm[k.toLowerCase().trim()] = String(r[k]).trim(); });
      return norm;
    });
  }

  console.log(`📂 Tracker loaded: ${rows.length} rows from ${path.basename(filePath)}`);
  return rows;
}

// ── Find matching tracker column key by keyword ────────────────────
function findCol(row, keywords) {
  const keys = Object.keys(row);
  for (const kw of keywords) {
    const found = keys.find(k => k.includes(kw));
    if (found) return row[found];
  }
  return '';
}

// ── Compare a bug row against tracker rows ─────────────────────────
function matchTracker(bug, trackerRows) {
  for (const tr of trackerRows) {
    const trId     = findCol(tr, ['bug id','issue id','id','key','bug']);
    const trTitle  = findCol(tr, ['title','summary','name','description','subject']);
    const trStatus = findCol(tr, ['status','state','resolution']);
    const trModule = findCol(tr, ['module','feature','component','area']);
    const trTcId   = findCol(tr, ['tc id','test case','linked tc','tc']);

    // Rule 1: Bug ID exact match
    if (trId && trId.toLowerCase() === bug.bugId.toLowerCase()) {
      return { exists: 'Yes', trackerId: trId, trackerStatus: trStatus };
    }

    // Rule 2: TC ID + Module match
    if (trTcId && trTcId === bug.tcId && trModule &&
        trModule.toLowerCase() === bug.feature.toLowerCase()) {
      return { exists: 'Yes', trackerId: trId, trackerStatus: trStatus };
    }

    // Rule 3: Title similarity (>70% word match)
    if (trTitle) {
      const bugWords     = bug.title.toLowerCase().split(/\W+/).filter(Boolean);
      const trackerWords = trTitle.toLowerCase().split(/\W+/).filter(Boolean);
      const matches      = bugWords.filter(w => trackerWords.includes(w)).length;
      const similarity   = bugWords.length ? matches / bugWords.length : 0;
      if (similarity >= 0.7) {
        return { exists: 'Yes', trackerId: trId, trackerStatus: trStatus };
      }
    }
  }
  return { exists: 'No', trackerId: '', trackerStatus: '' };
}

// ── MAIN: Generate daily bug report ───────────────────────────────
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
    const bug     = { bugId, tcId, title: t.title, feature };

    const tracker = matchTracker(bug, trackerRows);

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
      'Remarks':               tracker.exists === 'Yes' ? `Matched in tracker: ${tracker.trackerId}` : 'New bug — not yet in tracker',
    };
  });

  // ── Build workbook ───────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(bugRows.length ? bugRows : [{}], { header: bugHeader });

  ws['!cols'] = [
    {wch:18},{wch:50},{wch:18},{wch:14},{wch:10},{wch:8},
    {wch:40},{wch:45},{wch:35},{wch:45},
    {wch:14},{wch:14},{wch:16},{wch:45},
    {wch:20},{wch:16},{wch:16},{wch:35}
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bug Report');

  // ── Save ─────────────────────────────────────────────────────────
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  XLSX.writeFile(wb, reportPath);

  // ── Summary ──────────────────────────────────────────────────────
  const inTracker  = bugRows.filter(r => r['Bug Exists in Tracker'] === 'Yes').length;
  const notTracked = bugRows.filter(r => r['Bug Exists in Tracker'] === 'No').length;

  console.log(`\n✅ Daily Bug Report saved to: ${reportPath}`);
  console.log(`📅 Date       : ${dateStr}`);
  console.log(`🐛 Total bugs : ${bugRows.length}`);
  console.log(`✅ In tracker : ${inTracker}`);
  console.log(`🆕 New bugs   : ${notTracked}`);
  if (trackerFile) {
    console.log(`📂 Tracker    : ${path.basename(trackerFile)}`);
  } else {
    console.log(`📂 Tracker    : No tracker file provided (run with --tracker=filename.xlsx to compare)`);
  }
}

generateDailyBugReport();
```

---

## NPM Scripts to Add

```json
{
  "scripts": {
    "bug-report:daily":          "node utils/generate-daily-bug-report.js",
    "bug-report:with-tracker":   "node utils/generate-daily-bug-report.js --tracker=tracker_upload.xlsx"
  }
}
```

---

## How to Use

### Generate daily bug report (no tracker comparison)
```bash
npm run bug-report:daily
```
Output: `Daily Bug Report\BugReport_23-Jun-2026.xlsx`

---

### Generate with tracker comparison

**Step 1** — Drop your tracker file into:
```
D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\tracker-uploads\
```
Supported: `.xlsx`, `.xls`, `.csv`

**Step 2** — Run:
```bash
node utils/generate-daily-bug-report.js --tracker=your_tracker_file.xlsx
# or
npm run bug-report:with-tracker
```

**Step 3** — Open `BugReport_DD-MMM-YYYY.xlsx` and check columns O, P, Q:

| Bug Exists in Tracker | Tracker Bug ID | Tracker Status |
|-----------------------|----------------|----------------|
| Yes                   | JIRA-1023      | In Progress    |
| No                    |                |                |

---

## Tracker File Format Examples

### Jira CSV Export
```
Issue Key, Summary, Status, Component
JIRA-1023, Login fails with valid credentials, In Progress, Login
JIRA-1045, Empty password not validated, Open, Login
```

### Manual Excel Tracker
| Bug ID       | Title                               | Status      | Module |
|--------------|-------------------------------------|-------------|--------|
| BUG-LOGIN-001| Login fails with valid credentials  | In Progress | Login  |

---

## Matching Priority Order

1. **Bug ID exact match**        — most reliable
2. **TC ID + Module match**      — good for automation-linked bugs
3. **Title similarity ≥ 70%**    — catches renamed/rephrased duplicates

---

## GitHub Actions Integration

The daily bug report is also generated in the nightly regression workflow.
Add this step to `.github/workflows/regression.yml` after test run:

```yaml
- name: Generate daily bug report
  run: node utils/generate-daily-bug-report.js
  continue-on-error: true

- name: Upload daily bug report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: daily-bug-report-${{ github.run_id }}
    path: Daily Bug Report/
    retention-days: 60
```
