# ============================================================
#  CustomerPortal QA — Auto Push to GitHub After Test Run
#  Repo: https://github.com/TestQueens555/Customer_connect.git
#  Usage: .\push-after-report.ps1 -Feature Login
#         npm run push:github
# ============================================================

param(
  [string]$Feature = "Login",
  [string]$Branch  = "main"
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Timestamp   = Get-Date -Format "yyyy-MM-dd HH:mm"
$DateFolder  = Get-Date -Format "yyyy-MM-dd"
$FeatureDir  = Join-Path $ProjectRoot "Test Execution Report\Feature Reports"
$DailyDir    = Join-Path $ProjectRoot "Test Execution Report\Daily Reports"

function Write-Step($num, $msg) {
  Write-Host "`n[$num] $msg" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CustomerPortal QA — Auto Push Pipeline"    -ForegroundColor Cyan
Write-Host "  Feature  : $Feature"                       -ForegroundColor Gray
Write-Host "  Date     : $Timestamp"                     -ForegroundColor Gray
Write-Host "  Branch   : $Branch"                        -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

# ── STEP 1: Run Playwright tests ──────────────────────────────
Write-Step "1/5" "Running Playwright tests for $Feature..."
npx playwright test "tests/$($Feature.ToLower()).spec.js"
$TestExitCode = $LASTEXITCODE
if ($TestExitCode -ne 0) {
  Write-Host "  ⚠ Tests completed with failures" -ForegroundColor Red
} else {
  Write-Host "  ✔ All tests passed" -ForegroundColor Green
}

# ── STEP 2: Generate Excel reports ────────────────────────────
Write-Step "2/5" "Generating Excel reports..."

# Feature report
$FeatureReport = Join-Path $FeatureDir "$Feature.xlsx"
Write-Host "  → Feature report : $FeatureReport" -ForegroundColor Gray
node utils/generate-report.js --feature=$Feature

# Daily bug report
$DailyReport = Join-Path $DailyDir "DailyBugReport_$DateFolder.xlsx"
Write-Host "  → Daily report   : $DailyReport" -ForegroundColor Gray
node utils/generate-daily-report.js --feature=$Feature

Write-Host "  ✔ Excel reports generated" -ForegroundColor Green

# ── STEP 3: Stage all changes including Excel reports ─────────
Write-Step "3/5" "Staging all changes..."
git add .
git status --short

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "  ℹ Nothing new to commit" -ForegroundColor Cyan
  exit 0
}

# ── STEP 4: Commit ────────────────────────────────────────────
Write-Step "4/5" "Committing..."
if ($TestExitCode -ne 0) {
  $CommitMsg = "QA [$DateFolder] $Feature — FAILED — reports updated"
} else {
  $CommitMsg = "QA [$DateFolder] $Feature — PASSED — reports updated"
}

git commit -m $CommitMsg
if ($LASTEXITCODE -ne 0) { Write-Host "Commit failed!" -ForegroundColor Red; exit 1 }

# ── STEP 5: Push ──────────────────────────────────────────────
Write-Step "5/5" "Pushing to GitHub..."
git push origin $Branch
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed!" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✔ Done! Pushed to GitHub"                  -ForegroundColor Green
Write-Host "  $CommitMsg"                                 -ForegroundColor Gray
Write-Host "  https://github.com/TestQueens555/Customer_connect" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
