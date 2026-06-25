---
name: do-test-for-feature
description: >
  Full end-to-end QA pipeline executed entirely inside Claude — no external scripts needed.
  Trigger when user says "Do test for [Feature]", "test the [Feature] page", "run tests for [Feature]",
  "execute test cases for [Feature]", or any variation asking to test a specific feature/page
  of the CustomerConnect portal. Also triggers on "do full test", "run all tests".
  Pipeline: explore page → generate test cases → execute via browser → write POM automation files
  → run Playwright tests via Desktop Commander → generate Excel reports to Test Execution Report folder
  → commit and push to GitHub.
---

# Do Test For Feature — Full Pipeline

You are a **Senior QA Engineer** running a complete test pipeline inside Claude.
When triggered, execute ALL steps below in order — no manual steps, no interruptions.

---

## Pipeline Steps (Execute All In Order)

### STEP 1 — Login to Application
- Navigate to: `http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F`
- Username: `sajith_xyz` | Password: `User@123`
- Verify dashboard loaded
- ⚠️ NEVER use Forgot Password for this user

---

### STEP 2 — Explore the Target Feature Page
- Navigate to the feature under test
- Use `playwright:browser_snapshot` to map all:
  - Input fields (IDs, types, placeholders, validation rules)
  - Buttons and their actions
  - Dropdowns, chips, toggles
  - Success/error messages and their selectors
  - Page URL and title
- Use `playwright:browser_run_code_unsafe` to probe dynamic behaviour (API calls, locked states, counters)

---

### STEP 3 — Generate Test Cases
Generate across all 4 categories using TC-[MODULE]-NNN format:
- ✅ Positive — happy path, valid inputs
- ❌ Negative — invalid inputs, missing required fields
- 🔢 Boundary — min/max lengths, edge values
- ⚠️ Security — SQL injection, XSS, unauthenticated access

---

### STEP 4 — Write POM Automation Files
Create 3 files using `filesystem:write_file`:
- `pages/[Feature]Page.js` — locators + actions only (no assertions, no data)
- `test-data/[feature]Data.js` — all test values separated
- `tests/[feature].spec.js` — test cases (assertions only, import data from test-data/)

Locator priority: #id > getByRole > getByLabel > placeholder > CSS > NEVER XPath

---

### STEP 5 — Run Playwright Tests via Desktop Commander
```
cd /d "D:\Claude\QA_Projects\CustomerConnect"
npx playwright test tests/[feature].spec.js --reporter=list --timeout=60000
> "reports\[feature]-run.txt" 2>&1
```
- Use background execution (redirect to .txt file)
- Wait using `ping -n N 127.0.0.1 > nul` then read the file
- Fix any locator failures and re-run until all TCs pass

---

### STEP 6 — Generate Excel Reports
Save path: `D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\`

**Feature Report:**
`Test Execution Report\Feature Reports\[FeatureName].xlsx`
- Sheet 1: Test Execution (15 cols: TC ID → Remarks)
- Sheet 2: Bug Report (FAIL TCs only, 16 cols: Bug ID → Remarks)

**Daily Bug Report:**
`Test Execution Report\Daily Reports\BugReport_DD-Mon-YYYY.xlsx`
- If file exists today → append new rows
- If new day → create fresh file

Use `utils/init-[feature]-report.js` (Node + xlsx) to create blank workbooks first,
then `excel:excel_write_to_sheet` to fill data.

---

### STEP 7 — Commit and Push to GitHub
```
git pull origin main --rebase
git add .
git commit -m "feat: Add [Feature] module — X TCs PASS [Claude QA DD-Mon-YYYY]"
git push origin main
```

---

## Rules
- NEVER use Forgot Password for sajith_xyz
- NEVER hardcode credentials or test data in spec files
- Always re-login if session expired mid-test
- Fix all test failures before generating reports
- Environment: http://customerportal.dev-ts.online | Chromium | Windows
- Executed By: Claude QA Automation
