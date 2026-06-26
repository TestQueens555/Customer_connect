---
name: qa-pipeline
description: >
  Execute the complete end-to-end QA automation pipeline for CustomerConnect.
  Use EVERY TIME user says "Do test for [Feature]", "Run test for [Feature]",
  "Test [Feature]", "pipeline", "full test", or "automate [feature]".
  Covers all 8 steps in fixed order: explore, generate TCs, execute in browser,
  download Claude report, write POM+spec, push to GitHub, CI runs, pull reports.
  Never skip or reorder steps.
---

# CustomerConnect QA Pipeline — 8 Steps

## Project Context
- App URL: http://customerportal.dev-ts.online
- Credentials: sajith_xyz / User@123 (AdminPartner)
- NEVER test Forgot Password for sajith_xyz
- GitHub: https://github.com/TestQueens555/Customer_connect (main branch)
- Local: D:\Claude\QA_Projects\CustomerConnect\

---

## STEP 1 — Explore Feature Page Live

- Clear cookies: page.context().clearCookies()
- Login: sajith_xyz / User@123
- Navigate to the feature URL
- Take screenshot
- Inventory ALL: inputs, buttons, dropdowns, chips, textareas, file inputs, modals
- Record: IDs, placeholders, locators, page title, URL
- Note special behaviour: wizard steps, API-locked fields, custom upload handlers

Output: Confirmed page inventory table before proceeding.

---

## STEP 2 — Generate All Test Cases

Generate 20-22 TCs across 4 categories:

| Category | Count | Focus |
|---|---|---|
| Positive | 5-7 | Happy path, UI visible, valid inputs |
| Negative | 5-6 | Empty fields, invalid data, validation errors |
| Boundary | 4-5 | Min/max length, edge values, special chars |
| Security | 3-4 | SQL injection, XSS, HTML injection, unauth access |

Assign Layer to every TC:
- Unit: single field check, no network
- API: backend validates, credential sent to server
- Auto: full browser flow, navigation, redirect

Output: TC table with ID, Name, Type, Layer, Priority before executing.

---

## STEP 3 — Execute Every TC in Claude Browser

- Cookie isolation: clearCookies() before every TC
- Login once per batch (5-8 TCs per code block)
- SQL/XSS: use page.evaluate(() => document.querySelector('button[type="submit"]').click())
- Actual Result must be specific: URL, title, error text, element state
- Record: PASS / FAIL / BLOCKED

Output: All TC results with actual observed values.

---

## STEP 4 — Generate & Download Claude Report

Two Excel files via Python/openpyxl:

File 1: [Feature]_Claude_Report.xlsx
- Sheet 1: Test Execution (16 cols)
- Sheet 2: Bug Report (16 cols — FAILs only)

File 2: DailyBugReport_DD-Mon-YYYY_Claude.xlsx
- Sheet: Daily Bug Report (19 cols) — appends per feature

16-col headers: TC ID | Test Case Name | Module | Test Type | Priority | Layer | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Executed By | Execution Date | Environment | Remarks

19-col headers: Date | Feature | TC ID | Test Case Name | Test Type | Layer | Priority | Status | Bug ID | Bug Title | Severity | Bug Priority | Environment | Browser | OS | Steps to Reproduce | Expected Result | Actual Result | Source Report

Output: Both files presented for download.

---

## STEP 5 — Write / Update Playwright POM + Spec

3 files — must exactly match Step 3 TCs:

pages/[Feature]Page.js:
- Locators ONLY, no assertions, no test data
- navigateTo() uses domcontentloaded + waitForSelector
- No networkidle anywhere

tests/[feature].spec.js:
- One test per TC, TC ID in name: TC-FEAT-001 | ...
- beforeEach: clearCookies() + login + navigate
- Assertions only, domcontentloaded everywhere
- SQL/XSS: page.evaluate() click
- Tags: { tag: ['@smoke'] } etc.

test-data/[feature]Data.js:
- All test values here, no hardcoded data in spec
- File upload: exact Windows path from Step 1

Verify:
  node --check pages/[Feature]Page.js
  node --check tests/[feature].spec.js
  npx playwright test tests/[feature].spec.js --config playwright.config.js --list

List must show correct TC count.

---

## STEP 6 — Push to GitHub

  git add pages/[Feature]Page.js tests/[feature].spec.js test-data/[feature]Data.js
  git commit -m "test: [Feature] [N]/[N] PASS - Claude browser execution complete"
  git push origin main

Output: Confirmed push with commit SHA.

---

## STEP 7 — GitHub Actions CI Runs Automatically

CI runs playwright-tests.yml:
1. Detects feature from changed files
2. npx playwright test tests/[feature].spec.js --config playwright.config.js
3. REPORT_DIR="Test Execution Report_Git" node utils/generate-report.js --feature=[Feature]
4. Commits Excel to Test Execution Report_Git/Feature Reports/[Feature].xlsx

Check conclusion: success = go to Step 8 | failure = fix and push again

Scope rules (never full suite by accident):
- spec/page/data changes: runs that module only
- workflow/config/utils changes: runs Login smoke only
- default: runs Login smoke only

---

## STEP 8 — Pull CI Reports to Local

  git pull origin main

Reports land in:
  Test Execution Report_Git\Feature Reports\[Feature].xlsx  (CI)
  Test Execution Report\Feature Reports\[Feature].xlsx      (local npm run)

---

## Key Locators

Login: #UserName | #Password | button[type="button"]:first (eye) | #RememberMe | button[type="submit"] | span.text-sm.font-medium (error)

Create Ticket: input[placeholder="Select Project..."] | #txtPageName | #typeChips .ct-type-chip | #platformChips .ct-type-chip | #txtDescription | #descCount | #fileInput | #btnHeaderSubmit | #btnReset | .swal2-title | .ct-file-name

---

## Confirmed Findings

- Username NOT case-sensitive: SAJITH_XYZ logs in as sajith_xyz
- Create Ticket platforms: Backend, Flutter, Web Service, Integration, General, Testing (NOT Android/SFA)
- Create Ticket has SignalR — always domcontentloaded not networkidle
- File upload is custom handler — verify via .ct-file-name not files[].name

---

## Common Issues & Fixes

networkidle hangs → domcontentloaded everywhere
Excel EBUSY → close Excel file first
No tests found → use --config playwright.config.js
Binary Excel conflict → git checkout --ours Test* then git add Test*
SQL timeout → page.evaluate() click not .click()
Desktop Commander timeout → never run playwright through Claude — push to CI
