---
name: do-test-for-feature
description: >
  Full end-to-end QA pipeline. Trigger when user says "Do test for [Feature]".
  Phase 1: Claude executes all test cases live via browser and records results.
  Phase 2: Claude generates downloadable Excel (.xlsx) AND Word (.docx) reports
  directly in Claude — user downloads both from the chat window.
  Phase 3: Claude writes POM automation files and runs Playwright tests.
  Phase 4: Excel reports saved to Test Execution Report folder + pushed to GitHub.
---

# Do Test For Feature — Full Pipeline

## Overview

```
Trigger: "Do test for [Feature]"
         ↓
PHASE 1 — In-Browser Test Execution
  Login → Explore page → Generate TCs → Execute each TC live via browser
  Record: TC ID | Name | Steps | Expected | Actual | Status | Notes

PHASE 2 — Downloadable Reports (PRIMARY DELIVERABLE — before POM)
  ┌─────────────────────────────────────────────────────┐
  │  Excel (.xlsx)  —  4 sheets:                        │
  │    • Summary (project info + pass/fail counts)      │
  │    • Test Execution (all TCs, color-coded)          │
  │    • Bug Report (FAIL TCs only)                     │
  │    • Daily Bug Report (daily tracker row)           │
  │                                                     │
  │  Word (.docx)  —  A4 landscape, 6 sections:         │
  │    • Project Information                            │
  │    • Execution Summary table                        │
  │    • Coverage Breakdown by category                 │
  │    • Full test case results table                   │
  │    • Bug Report section                             │
  │    • Sign-off & Notes                               │
  │    (header + footer with page numbers on every page)│
  └─────────────────────────────────────────────────────┘
  User downloads both files directly from Claude chat.

PHASE 3 — POM Automation
  Write pages/[Feature]Page.js
  Write test-data/[feature]Data.js
  Write tests/[feature].spec.js
  Run via Desktop Commander → all TCs must PASS

PHASE 4 — Save + Push
  Save Excel to Test Execution Report\Feature Reports\[Feature].xlsx
  Save Excel to Test Execution Report\Daily Reports\BugReport_DD-Mon-YYYY.xlsx
  git pull → git add → git commit → git push
```

---

## STEP 1 — Login
- URL: http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F
- Username: sajith_xyz | Password: User@123
- ⚠️ NEVER use Forgot Password

---

## STEP 2 — Explore Feature Page
- Use playwright:browser_snapshot + browser_run_code_unsafe
- Map all fields, IDs, buttons, dropdowns, API calls, validations, error messages

---

## STEP 3 — Generate Test Cases
- ✅ Positive  ❌ Negative  🔢 Boundary  ⚠️ Security
- Format: TC-[MODULE]-001

---

## STEP 4 — Execute All TCs via Browser
- Run each TC live
- Collect into results array: [tcid, name, type, priority, precond, steps, data, expected, actual, status, remarks]

---

## STEP 5 — Generate Downloadable Reports (openpyxl + docx-js in bash_tool)

### Excel — use openpyxl with full formatting:
- Dark navy headers (#1E3A5F), color-coded status (green/red/amber)
- Color-coded test type columns (Positive=blue, Negative=pink, Boundary=green, Security=gold)
- Color-coded priority (Critical=red, High=orange, Medium=yellow, Low=blue)
- 4 sheets: Summary, Test Execution, Bug Report, Daily Bug Report
- Save to: /mnt/user-data/outputs/[Feature]_TestReport_DD-Mon-YYYY.xlsx

### Word — use docx npm package (node gen.js):
- A4 landscape, 1440 DXA margins
- Header: module name + date on every page
- Footer: Page N of M + "Claude QA Automation | Confidential"
- 6 sections with navy section headings + bottom border rule
- Color-coded tables matching Excel palette
- Save to: /mnt/user-data/outputs/[Feature]_TestReport_DD-Mon-YYYY.docx

### Present both files:
- Call present_files with both paths
- User downloads directly from Claude chat

---

## STEP 6 — POM Automation Files
- pages/[Feature]Page.js   ← locators + actions only
- test-data/[feature]Data.js ← all test values
- tests/[feature].spec.js  ← assertions only, imports data

---

## STEP 7 — Run Playwright Tests via Desktop Commander
- Background: npx playwright test tests/[feature].spec.js > reports/[feature]-run.txt 2>&1
- Wait → read file → fix failures → re-run until all PASS

---

## STEP 8 — Save Excel to Local + Push GitHub
- Test Execution Report\Feature Reports\[Feature].xlsx
- Test Execution Report\Daily Reports\BugReport_DD-Mon-YYYY.xlsx
- git pull --rebase → git add → git commit → git push

---

## Design Tokens (use in every report)
```
Header bg:    #1E3A5F  (dark navy)
Header fg:    #FFFFFF
PASS bg/fg:   #D6F4D6 / #1A6B1A
FAIL bg/fg:   #FDDEDE / #A81E1E
BLOCKED bg/fg:#FFF3CD / #856404
Positive bg:  #E8F4FD
Negative bg:  #FDF2F8
Boundary bg:  #EEF8EE
Security bg:  #FFF8E7
Critical bg:  #FDDEDE
High bg:      #FDE8CC
Medium bg:    #FFF3CD
Low bg:       #E8F4FD
Alt row:      #F5F8FC
Font:         Calibri, size 9 (data) / 10 (headers)
```

---

## Rules
- NEVER use Forgot Password for sajith_xyz
- Excel + Word reports are the PRIMARY deliverable — generate BEFORE POM
- Both reports must be downloadable via present_files
- All POM files: locators in page objects, assertions in specs, data in test-data/ only
- Fix ALL test failures before generating final reports
