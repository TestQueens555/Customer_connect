# CustomerConnect QA — Scripts Reference Skill

## Purpose
This skill file is the single source of truth for all scripts, commands, suggestions, and
run instructions for the CustomerConnect QA Automation project.
Every time this skill is used, the reference document is also auto-saved as a .txt file
into:  D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\Feature Reports\

---

## Project Details

| Field        | Value                                                               |
|-------------|---------------------------------------------------------------------|
| Project      | CustomerConnect QA Automation                                       |
| Project Root | D:\Claude\QA_Projects\CustomerConnect                               |
| Report Folder| D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\        |
| App URL      | http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F    |
| Username     | sajith_xyz                                                          |
| Password     | User@123                                                            |
| Browser      | Chromium                                                            |
| Framework    | Playwright + POM (Node.js)                                          |

---

## Folder Structure

```
D:\Claude\QA_Projects\CustomerConnect\
├── pages\
│   ├── BasePage.js               ← Shared methods (navigate, screenshot, wait)
│   ├── LoginPage.js              ← Login locators + actions
│   └── [Feature]Page.js          ← One file per page/feature
├── tests\
│   ├── login.spec.js             ← Login test cases
│   └── [feature].spec.js         ← One spec file per feature
├── test-data\
│   ├── loginData.js              ← All login test data
│   └── [feature]Data.js          ← Separate data file per feature
├── utils\
│   ├── config.js                 ← URLs, paths, credentials config
│   ├── generate-report.js        ← Feature Excel report generator
│   ├── generate-daily-bug-report.js ← Daily Bug Report generator
│   ├── init-reports.js           ← Creates blank Excel workbooks (run once)
│   └── save-reference.js         ← Saves this reference doc to report folder
├── references\
│   └── SKILL.md                  ← THIS FILE — scripts reference skill
├── reports\                      ← Playwright JSON + HTML output (auto-generated)
├── Test Execution Report\        ← All Excel reports saved here
│   ├── Feature Reports\
│   │   ├── Login.xlsx
│   │   ├── Dashboard.xlsx
│   │   ├── CreateTicket.xlsx
│   │   └── QA_Scripts_Reference.txt  ← Auto-saved reference document
│   └── Daily Reports\
│       └── BugReport_DD-Mon-YYYY.xlsx
├── playwright.config.js
└── package.json
```

---

## STEP 0 — First Time Setup (run once)

```bash
# Navigate to project
cd D:\Claude\QA_Projects\CustomerConnect

# Install all dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

---

## STEP 1 — Run Tests by Feature

### Login Tests
```bash
npx playwright test tests/login.spec.js
```

### Dashboard Tests
```bash
npx playwright test tests/dashboard.spec.js
```

### All Tests
```bash
npx playwright test
```

### Run with Browser Visible (headed mode)
```bash
npx playwright test tests/login.spec.js --headed
```

### Run in Debug Mode (step through each action)
```bash
npx playwright test tests/login.spec.js --debug
```

### Run a Single Test Case by Title
```bash
npx playwright test -g "TC-LOGIN-001"
```

---

## STEP 2 — Generate Feature-wise Excel Report

### Login Report
```bash
node utils/generate-report.js --feature=Login
```

### Dashboard Report
```bash
node utils/generate-report.js --feature=Dashboard
```

### Any Feature
```bash
node utils/generate-report.js --feature=[FeatureName]
```

> Report is saved to:
> D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\Feature Reports\[Feature].xlsx

---

## STEP 3 — Run Tests + Generate Report in One Command (npm scripts)

### Login — test + report
```bash
npm run run:login
```

### Dashboard — test + report
```bash
npm run run:dashboard
```

### All Features
```bash
npm run test:all
```

---

## STEP 4 — Regression Run (after code changes)

### Regression for Login
```bash
npm run regression:login
```

### Regression for Dashboard
```bash
npm run regression:dashboard
```

### Full Regression — all features
```bash
npm run regression:all
```

> Regression mode opens the existing Excel file, updates statuses,
> marks fixed bugs as Pass, and adds new bugs — history is never deleted.

---

## STEP 5 — View HTML Report in Browser

```bash
npx playwright show-report reports/html-report
# or
npm run report:open
```

---

## STEP 6 — Save This Reference Doc to Report Folder

```bash
node utils/save-reference.js
```

> Saves QA_Scripts_Reference.txt to:
> D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\Feature Reports\

---

## All npm Scripts (package.json)

| Script                     | Command                              | What it does                               |
|---------------------------|--------------------------------------|--------------------------------------------|
| test:login                | npm run test:login                   | Run login spec only                        |
| test:dashboard            | npm run test:dashboard               | Run dashboard spec only                    |
| test:createticket         | npm run test:createticket            | Run create ticket spec only                |
| test:all                  | npm run test:all                     | Run all specs                              |
| report:login              | npm run report:login                 | Generate Login.xlsx feature report         |
| report:dashboard          | npm run report:dashboard             | Generate Dashboard.xlsx feature report     |
| report:createticket       | npm run report:createticket          | Generate CreateTicket.xlsx feature report  |
| bug-report:daily          | npm run bug-report:daily             | Generate daily bug report Excel            |
| run:login                 | npm run run:login                    | Test + feature report + daily report       |
| run:dashboard             | npm run run:dashboard                | Test + feature report + daily report       |
| run:createticket          | npm run run:createticket             | Test + feature report + daily report       |
| regression:login          | npm run regression:login             | Regression run + update Login.xlsx         |
| regression:dashboard      | npm run regression:dashboard         | Regression run + update Dashboard.xlsx     |
| regression:createticket   | npm run regression:createticket      | Regression run + update CreateTicket.xlsx  |
| regression:all            | npm run regression:all               | Full regression all features               |
| init-reports              | npm run init-reports                 | Create blank Excel workbooks               |
| save-reference            | npm run save-reference               | Save reference doc to Feature Reports\     |
| report:open               | npm run report:open                  | Open Playwright HTML report in browser     |

---

## Playwright CLI — Useful Flags

| Flag                        | Purpose                                      |
|-----------------------------|----------------------------------------------|
| --headed                    | Run with browser visible                     |
| --debug                     | Step-through debugger                        |
| --ui                        | Playwright UI mode (visual test runner)      |
| -g "test title"             | Run a specific test by name                  |
| --reporter=list             | Console output format                        |
| --reporter=html             | HTML report (saved to reports/html-report)   |
| --retries=2                 | Retry failed tests N times                   |
| --workers=1                 | Run tests sequentially                       |
| --timeout=60000             | Set global timeout (ms)                      |

---

## Adding a New Feature — Checklist

When adding a new page/feature to the automation:

1. [ ] Create `pages/[Feature]Page.js` — locators + actions only
2. [ ] Create `test-data/[feature]Data.js` — all test values
3. [ ] Create `tests/[feature].spec.js` — test cases with TC-IDs
4. [ ] Add npm scripts to `package.json`:
       - test:[feature], report:[feature], run:[feature], regression:[feature]
5. [ ] Run: `npm run run:[feature]`
6. [ ] Verify Excel saved to `Test Execution Report\Feature Reports\[Feature].xlsx`

---

## Locator Priority (POM Best Practice)

```
1. data-testid   →  page.getByTestId('element')         ← MOST PREFERRED
2. ARIA role     →  page.getByRole('button', { name })
3. Label         →  page.getByLabel('Username')
4. Placeholder   →  page.getByPlaceholder('Enter...')
5. Element ID    →  page.locator('#ElementId')
6. CSS class     →  page.locator('.class-name')          ← LAST RESORT
7. XPath         →  NEVER USE
```

---

## Test ID Naming Convention

```
TC-[FEATURE]-[NUMBER]    →  TC-LOGIN-001, TC-DASHBOARD-003
BUG-[FEATURE]-[NUMBER]   →  BUG-LOGIN-001, BUG-DASHBOARD-002
```

---

## Environment

| Item         | Value                                      |
|-------------|--------------------------------------------|
| OS           | Windows                                    |
| Node.js      | v22+                                       |
| Playwright   | ^1.40.0                                    |
| xlsx         | ^0.18.5                                    |
| Browser      | Chromium (Desktop Chrome)                  |
| Report Path  | D:\Claude\QA_Projects\CustomerConnect\Test Execution Report\ |
| Screenshot   | C:\Users\Turbosoft PC\OneDrive\Pictures\Screenshots 1\ |
