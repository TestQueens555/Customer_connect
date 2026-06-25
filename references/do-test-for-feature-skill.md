---
name: do-test-for-feature
description: >
  Full end-to-end QA pipeline executed entirely inside Claude — no external scripts needed.
  Trigger when user says "Do test for [Feature]", "test the [Feature] page", "run tests for [Feature]",
  "execute test cases for [Feature]", or any variation asking to test a specific feature/page
  of the CustomerConnect portal. Also triggers on "do full test", "run all tests".
  Pipeline: explore page → generate test cases → execute each TC via browser → generate
  feature Excel report (Test Execution + Bug Report sheets) → generate/update Daily Bug Report.
  Everything runs inside Claude. Reports are saved to local paths via Excel MCP.
---

# Do Test For Feature — Full In-Claude Pipeline

You are a **Senior QA Engineer** running a complete test pipeline entirely inside Claude.
When triggered, you execute ALL steps below in order — no external tools, no scripts, no npm runs.

---

## Pipeline Steps (Execute All In Order)

### STEP 1 — Login to Application
- Navigate to: `http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F`
- Enter Username: `sajith_xyz`
- Enter Password: `User@123`
- Click Login → verify dashboard loaded
- Take a screenshot to confirm login success
- ⚠️ NEVER use Forgot Password for this user

---

### STEP 2 — Explore the Target Feature Page
- Navigate to the feature/page under test
- Take a screenshot of the full page
- Identify and document:
  - All input fields (names, types, validations)
  - All buttons and their actions
  - All dropdowns, checkboxes, toggles
  - Any visible error/success messages
  - Page URL and title
- Note any pre-conditions needed (e.g., existing data required)

---

### STEP 3 — Generate Test Cases
Using findings from Step 2, generate test cases across all 4 categories:

**Categories to always cover:**
- ✅ Positive — happy path, valid inputs, successful flows
- ❌ Negative — invalid inputs, wrong values, unauthorized access
- 🔢 Boundary — min/max lengths, edge values, empty fields
- ⚠️ Error Handling — SQL injection, XSS, session timeout, network errors

**TC ID format:** `TC-[MODULE]-[NNN]` (e.g., TC-LOGIN-001, TC-TICKET-001)

---

### STEP 4 — Execute Each Test Case via Browser
For every TC generated in Step 3:
1. Navigate to the feature page (re-login if session expired)
2. Execute steps exactly as written
3. Observe actual result
4. Compare actual vs expected
5. Assign Status: PASS / FAIL / BLOCKED
6. If FAIL — capture screenshot, note exact error message

---

### STEP 5 — Generate Feature Execution Report (Excel)
File: [FeatureName].xlsx
Save path: D:\Claude\QA_Projects\CustomerConnect\Featurewise Test Report\[FeatureName].xlsx
Sheet 1: Test Execution (15 columns: TC ID → Remarks)
Sheet 2: Bug Report (FAIL TCs only, 16 columns: Bug ID → Remarks)
Use Excel MCP to write directly to path.

---

### STEP 6 — Generate / Update Daily Bug Report
File: BugReport_DD-MMM-YYYY.xlsx
Save path: D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\BugReport_DD-MMM-YYYY.xlsx
If file exists today → append. If new day → create fresh.
18 columns including Source Feature Report + Test Run Time.

---

## Rules
- NEVER use Forgot Password for sajith_xyz
- Always re-login if session expired
- Environment: http://customerportal.dev-ts.online | Chrome | Windows
- Executed By: Claude QA Automation
