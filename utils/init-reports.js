/**
 * utils/init-reports.js
 * Creates blank Excel files for every feature so Excel MCP can write to them.
 * Runs automatically before every test via package.json "pretest" hook.
 * Uses the xlsx package already installed in this project.
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const FW_DIR  = path.join(ROOT, 'Featurewise Test Report');
const DB_DIR  = path.join(ROOT, 'Daily Bug Report');

// Date for daily report filename
const today   = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileDate = today.replace(/ /g, '-');   // e.g. 24-Jun-2026

// Features to initialise — add new features here as the project grows
const FEATURES = ['Login', 'Dashboard', 'CreateTicket', 'ActionQueue', 'Profile', 'Partners', 'Customers'];

function createBlank(filePath, sheetNames) {
  if (fs.existsSync(filePath)) return; // never overwrite existing data
  const wb = XLSX.utils.book_new();
  sheetNames.forEach(name => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), name));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  XLSX.writeFile(wb, filePath);
  console.log(`  created: ${filePath}`);
}

console.log('\n📁 Initialising Excel report files...');

// Featurewise reports — one per feature
FEATURES.forEach(feature => {
  const fp = path.join(FW_DIR, `${feature}.xlsx`);
  createBlank(fp, ['Test Execution', 'Bug Report']);
});

// Daily bug report — one per day
const dbPath = path.join(DB_DIR, `BugReport_${fileDate}.xlsx`);
createBlank(dbPath, ['Daily Bug Report', 'Test Summary']);

console.log('✅ Excel files ready.\n');
