#!/usr/bin/env node
// utils/verifySpec.js — Pre-push spec quality gate
// Run: node utils/verifySpec.js tests/yourfeature.spec.js
// Catches ALL 5 root causes before pushing to CI.
//
// Exit 0 = all checks pass (safe to push)
// Exit 1 = one or more checks failed (fix before pushing)
'use strict';
const fs   = require('fs');
const path = require('path');
const args = process.argv.slice(2);

if (!args[0]) {
  console.error('Usage: node utils/verifySpec.js tests/<feature>.spec.js');
  process.exit(1);
}

const specFile = args[0];
const ROOT     = path.join(__dirname, '..');
const specPath = path.join(ROOT, specFile);

if (!fs.existsSync(specPath)) {
  console.error(`Spec not found: ${specPath}`);
  process.exit(1);
}

const spec      = fs.readFileSync(specPath, 'utf8');
const workflow  = fs.readFileSync(path.join(ROOT, '.github/workflows/playwright-tests.yml'), 'utf8');
const basename  = path.basename(specFile, '.spec.js');       // e.g. addnewuser
const featurePascal = basename.split(/[-_]/).map(w => w[0].toUpperCase() + w.slice(1)).join('');

let passed = 0;
let failed = 0;
const results = [];

function check(id, description, condition, fix) {
  if (condition) {
    results.push({ id, status: 'PASS', description });
    passed++;
  } else {
    results.push({ id, status: 'FAIL', description, fix });
    failed++;
  }
}

// ── CHECK 1: loginHelper imported (not defined locally) ──────────────────────
// login.spec.js is exempt — it tests the login page itself, no helper needed
const isLoginSpec = basename === 'login';
check(
  'C-01', 'loginHelper imported — no local loginAndGetPage',
  isLoginSpec ||
  (spec.includes("require('../utils/loginHelper')") && !spec.includes('async function loginAndGetPage')),
  "Add: const { loginAndGoTo, waitForFeedback, dismissFeedback } = require('../utils/loginHelper');\n" +
  "Remove any local loginAndGetPage() or loginAndNavigate() definitions.\n" +
  "(login.spec.js is exempt — it tests the login page itself)"
);

// ── CHECK 2: url.toString() used (Playwright 1.61.1 URL object) ──────────────
check(
  'C-02', 'url.toString().includes() — no raw url.includes()',
  !spec.includes('url.includes(') || spec.includes('url.toString().includes('),
  "Replace: url => !url.includes('Login')\n" +
  "With:    url => !url.toString().includes('Login')"
);

// ── CHECK 3: waitForFeedback used (not hardcoded success check) ───────────────
const hasHardcodedFeedback = spec.includes('#feedbackModalOverlay.open') ||
                             (spec.includes("'.open'") && spec.includes('feedback'));
check(
  'C-03', 'waitForFeedback() used — no hardcoded .open class check',
  !hasHardcodedFeedback || spec.includes('waitForFeedback'),
  "Replace: page.locator('#feedbackModalOverlay.open').waitFor(...)\n" +
  "With:    await waitForFeedback(page)  // from loginHelper"
);

// ── CHECK 4: No .last() on shared CSS classes ─────────────────────────────────
check(
  'C-04', 'No .last() on shared CSS classes (e.g. .um-btn-primary)',
  !spec.includes('.last()') || !spec.includes('um-btn-primary'),
  "Replace: page.locator('button.um-btn-primary').last()\n" +
  "With:    page.locator('#yourModal button.um-btn-primary')  // scope to modal"
);

// ── CHECK 5: Metadata file exists ─────────────────────────────────────────────
const metaBasename=basename.toLowerCase();
const metaPath=path.join(ROOT,"test-data",metaBasename+"Metadata.js");
check(
  'C-05', `Metadata file exists: test-data/${basename}Metadata.js`,
  fs.existsSync(metaPath),
  `Create: test-data/${basename}Metadata.js\n` +
  "Map all TC IDs to { steps, expectedResult, testData, preconditions, bugSteps }"
);

// ── CHECK 6: Metadata filename is lowercase (Linux CI case-sensitive) ─────────
if (fs.existsSync(metaPath)) {
  const actualFiles = fs.readdirSync(path.join(ROOT, 'test-data'));
  const metaFilename = basename.toLowerCase()+"Metadata.js";
  check(
    'C-06', `Metadata filename is lowercase: ${metaFilename}`,
    actualFiles.includes(metaFilename),
    `Rename to all-lowercase: git mv test-data/WRONG.js test-data/temp.js && git mv test-data/temp.js test-data/${metaFilename}`
  );
}

// ── CHECK 7: Spec filename has no spaces or illegal chars ────────────────────
check(
  'C-07', `Spec filename has no spaces/uppercase-start: ${basename}.spec.js`,
  /^[a-z][a-zA-Z0-9]+$/.test(basename) || basename === basename.toLowerCase(),
  `Ensure spec filename starts with lowercase: ${basename}.spec.js`
);

// ── CHECK 8: CI will auto-detect this spec ────────────────────────────────────
const hasAutoDetect = workflow.includes("grep '^tests/.*\\.spec\\.js$'");
check(
  'C-08', 'CI workflow has auto-detect scope (no manual elif needed)',
  hasAutoDetect,
  "Run: node reports/fix_workflow2.js to apply the auto-detect scope fix"
);

// ── CHECK 9: unauthAccess test present (security coverage) ────────────────────
check(
  'C-09', 'Unauthenticated access TC present',
  spec.includes('unauthAccess') || spec.includes('Unauthenticated'),
  "Add a TC using unauthAccess(browser, targetPath) from loginHelper"
);

// ── CHECK 10: evaluate blocks under 100 lines each ────────────────────────────
const evaluateBlocks = spec.match(/page\.evaluate\([^)]*\{([\s\S]*?)\}\)/g) || [];
const longBlocks = evaluateBlocks.filter(b => b.split('\n').length > 100);
check(
  'C-10', 'All evaluate() blocks under 100 lines (prevents MCP timeout)',
  longBlocks.length === 0,
  `${longBlocks.length} evaluate() block(s) exceed 100 lines — split them`
);

// ── PRINT RESULTS ──────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(70));
console.log(`  SPEC QUALITY GATE: ${specFile}`);
console.log('═'.repeat(70));
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} [${r.id}] ${r.description}`);
  if (r.status === 'FAIL') {
    console.log(`       FIX: ${r.fix.replace(/\n/g, '\n            ')}`);
  }
});
console.log('═'.repeat(70));
console.log(`  Result: ${passed} PASS / ${failed} FAIL`);
console.log('═'.repeat(70) + '\n');

if (failed > 0) {
  console.error(`🚫 ${failed} check(s) failed — fix before pushing to CI\n`);
  process.exit(1);
} else {
  console.log('✅ All checks passed — safe to push\n');
  process.exit(0);
}
