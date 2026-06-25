/**
 * utils/init-reports.js
 * Creates blank Excel files so Excel MCP can write to them.
 * Safe to run multiple times — never overwrites existing data.
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const FEATURE_DIR = path.join(ROOT, 'Test Execution Report', 'Feature Reports');
const DAILY_DIR   = path.join(ROOT, 'Test Execution Report', 'Daily Reports');

const today    = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileDate = today.replace(/ /g, '-');

// Add new features here as the project grows
const FEATURES = ['Login', 'Dashboard', 'CreateTicket', 'ActionQueue',
                  'Profile', 'Partners', 'Customers'];

function createBlank(filePath, sheetNames) {
  if (fs.existsSync(filePath)) return;
  const wb = XLSX.utils.book_new();
  sheetNames.forEach(name =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), name)
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  XLSX.writeFile(wb, filePath);
  console.log(`  created: ${filePath}`);
}

console.log('\n📁 Initialising Excel report files...');

FEATURES.forEach(feature => {
  createBlank(
    path.join(FEATURE_DIR, `${feature}.xlsx`),
    ['Test Execution', 'Bug Report']
  );
});

createBlank(
  path.join(DAILY_DIR, `BugReport_${fileDate}.xlsx`),
  ['Daily Bug Report', 'Test Summary']
);

console.log('✅ Excel files ready.\n');
