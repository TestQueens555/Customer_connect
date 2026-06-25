============================================================
  CustomerConnect QA — GitHub Push Guide
  Repository: https://github.com/TestQueens555/Customer_connect.git
============================================================

STEP 1 — Install Git (if not already installed)
-------------------------------------------------
Download from: https://git-scm.com/download/win
After install, verify:
  git --version


STEP 2 — Open Terminal in Project Folder
------------------------------------------
Option A: Open Command Prompt / PowerShell and run:
  cd D:\Claude\QA_Projects\CustomerConnect

Option B: In Windows Explorer, navigate to the folder,
  right-click > "Open in Terminal"


STEP 3 — Initialize Git & Push (First Time Only)
--------------------------------------------------
Run these commands one by one:

  git init
  git add .
  git commit -m "Initial commit — CustomerConnect QA Automation"
  git branch -M main
  git remote add origin https://github.com/TestQueens555/Customer_connect.git
  git push -u origin main


STEP 4 — For Future Pushes (after any changes)
------------------------------------------------
  cd D:\Claude\QA_Projects\CustomerConnect
  git add .
  git commit -m "describe your change here"
  git push


WHAT GETS PUSHED (tracked files)
----------------------------------
  .github/workflows/playwright.yml    ← Auto-runs tests on push
  .github/workflows/ci.yml            ← PR lint + smoke test gate
  .github/workflows/regression.yml    ← Nightly regression schedule
  pages/BasePage.js
  pages/LoginPage.js
  tests/login.spec.js
  test-data/loginData.js
  utils/config.js
  utils/generate-report.js
  utils/save-reference.js
  references/SKILL.md
  playwright.config.js
  package.json
  README.md
  .gitignore
  PUSH_TO_GITHUB.md


WHAT IS IGNORED (not pushed)
------------------------------
  node_modules/
  reports/
  Featurewise Test Report/    <- Excel files generated locally
  *.log
  .env


AFTER PUSH — VERIFY GITHUB ACTIONS RUNNING
--------------------------------------------
1. Go to: https://github.com/TestQueens555/Customer_connect
2. Click the "Actions" tab
3. You should see workflows starting automatically:
   - "Playwright E2E Tests" triggered by your push
4. Click into the run to see live logs
5. After run completes, scroll down to "Artifacts"
6. Download "featurewise-test-reports-{run_id}" to get Excel files


AUTHENTICATION — Personal Access Token (PAT)
---------------------------------------------
GitHub no longer accepts passwords for git push.
Use a Personal Access Token instead:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: CustomerConnect QA
4. Select scope: repo (full control)
5. Click Generate token — COPY IT NOW (shown only once)
6. When git asks for password — paste the token

Store it safely (e.g. in Windows Credential Manager).


NIGHTLY REGRESSION SCHEDULE
------------------------------
After push, regression.yml will automatically run every night at:
  12:00 AM UTC  =  5:30 AM IST

You can also trigger it manually:
1. Go to: https://github.com/TestQueens555/Customer_connect/actions
2. Click "Regression — Nightly & On-Demand"
3. Click "Run workflow"
4. Select feature: all / Login / Dashboard etc.
5. Click "Run workflow"

============================================================
