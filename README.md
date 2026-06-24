# Customer Connect — QA Automation Suite

E2E test automation for the Customer Portal using **Playwright + Allure Reports**, with auto-push to GitHub via Desktop Claude.

## 🗂️ Project Structure
```
Customer_connect/
├── pages/              ← Page Object Model classes
│   ├── BasePage.js
│   ├── LoginPage.js
│   └── DashboardPage.js
├── tests/              ← Test spec files
│   └── login.spec.js
├── test-data/          ← Test data (never hardcoded in specs)
│   └── loginData.js
├── utils/
│   └── config.js       ← URLs, env config
├── allure-report/      ← Generated HTML report (auto-pushed)
├── playwright.config.js
├── push-after-report.ps1  ← Auto-push script
└── package.json
```

## ▶️ Run Commands

```bash
# Run by page/feature
npm run test:login
npm run test:dashboard

# Run by tag
npm run test:smoke
npm run test:regression
npm run test:security

# Full pipeline: test + allure + push to GitHub
npm run run:and:push

# Individual steps
npm run run:all          # test + allure only
npm run push:github      # push to GitHub only
npm run allure:open      # open report in browser
```

## 🔐 Credentials
- **URL:** http://customerportal.dev-ts.online/Account/Login
- **Role:** AdminPartner → sajith_xyz

## 🤖 Auto-Push Flow
```
npm run run:and:push
  → npx playwright test
  → allure generate
  → git add .
  → git commit -m "QA Run [date]: ..."
  → git push origin main
```
