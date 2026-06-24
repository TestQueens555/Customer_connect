# ============================================================
#  CustomerPortal QA — Auto Push to GitHub After Allure Report
#  Repo: https://github.com/TestQueens555/Customer_connect.git
#  Usage: .\push-after-report.ps1  OR  npm run push:github
# ============================================================

param(
  [string]$TestFile = "",
  [string]$Branch   = "main"
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm"
$DateFolder = Get-Date -Format "yyyy-MM-dd"

function Write-Header($msg) {
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "  $msg"                                   -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Step($num, $msg) {
  Write-Host ""
  Write-Host "[$num] $msg" -ForegroundColor Yellow
}

Write-Header "CustomerPortal QA — Auto Push Pipeline"
Write-Host "  Timestamp : $Timestamp"     -ForegroundColor Gray
Write-Host "  Branch    : $Branch"        -ForegroundColor Gray
Write-Host "  Repo      : https://github.com/TestQueens555/Customer_connect" -ForegroundColor Gray

# ── STEP 1: Run Playwright Tests ──────────────────────────────
Write-Step "1/4" "Running Playwright tests..."

if ($TestFile -ne "") {
  Write-Host "  Running: $TestFile" -ForegroundColor Gray
  npx playwright test $TestFile
} else {
  npx playwright test
}

$TestExitCode = $LASTEXITCODE
if ($TestExitCode -ne 0) {
  Write-Host "  ⚠ Tests completed with failures (exit code $TestExitCode)" -ForegroundColor Red
  Write-Host "  Continuing to generate report anyway..." -ForegroundColor Yellow
} else {
  Write-Host "  ✔ All tests passed" -ForegroundColor Green
}

# ── STEP 2: Generate Allure Report ───────────────────────────
Write-Step "2/4" "Generating Allure HTML report..."
allure generate allure-results --clean -o allure-report

if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✘ Allure report generation failed!" -ForegroundColor Red
  exit 1
}
Write-Host "  ✔ Allure report generated at: allure-report\" -ForegroundColor Green


# ── STEP 3: Stage Files ───────────────────────────────────────
Write-Step "3/4" "Staging all changes for commit..."
git add .
git status --short

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "  ℹ Nothing new to commit — repo is up to date." -ForegroundColor Cyan
  exit 0
}

# ── STEP 4: Commit + Push ─────────────────────────────────────
Write-Step "4/4" "Committing and pushing to GitHub..."

if ($TestExitCode -ne 0) {
  $CommitMsg = "QA Run [$DateFolder]: Tests FAILED — Allure report updated"
} else {
  $CommitMsg = "QA Run [$DateFolder]: All tests PASSED — Allure report updated"
}

git commit -m $CommitMsg
$CommitCode = $LASTEXITCODE

if ($CommitCode -ne 0) {
  Write-Host "  ✘ Commit failed!" -ForegroundColor Red
  exit 1
}

git push origin $Branch
$PushCode = $LASTEXITCODE

if ($PushCode -ne 0) {
  Write-Host ""
  Write-Host "  ✘ Push failed! Possible causes:" -ForegroundColor Red
  Write-Host "    • Not authenticated — run: git push origin main (browser popup will appear)" -ForegroundColor Yellow
  Write-Host "    • Branch protection — check GitHub repo settings" -ForegroundColor Yellow
  exit 1
}

# ── DONE ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✔ Pipeline Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Commit : $CommitMsg" -ForegroundColor Gray
Write-Host "  Branch : $Branch"    -ForegroundColor Gray
Write-Host "  View   : https://github.com/TestQueens555/Customer_connect" -ForegroundColor Cyan
Write-Host ""
