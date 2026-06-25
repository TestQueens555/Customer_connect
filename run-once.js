// run-once.js  — delete this file after running
// Run: node run-once.js
// Creates blank Excel files then deletes itself

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const ROOT   = __dirname;
const FW_DIR = path.join(ROOT, 'Featurewise Test Report');
const DB_DIR = path.join(ROOT, 'Daily Bug Report');
const today  = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g,'-');

function create(p, sheets) {
  if (fs.existsSync(p)) { console.log(`exists: ${p}`); return; }
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), s));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  XLSX.writeFile(wb, p);
  console.log(`created: ${p}`);
}

create(path.join(FW_DIR, 'Login.xlsx'),                     ['Test Execution', 'Bug Report']);
create(path.join(DB_DIR, `BugReport_${today}.xlsx`),        ['Daily Bug Report', 'Test Summary']);

fs.unlinkSync(__filename);
console.log('Done. This file deleted itself.');
