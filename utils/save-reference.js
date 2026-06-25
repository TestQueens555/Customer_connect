// utils/save-reference.js
// Reads references/SKILL.md and saves a copy as QA_Scripts_Reference.txt
// into Test Execution Report/Feature Reports/
// Usage: node utils/save-reference.js

const fs   = require('fs');
const path = require('path');

const OUTPUT_DIR  = path.join(__dirname, '../Test Execution Report/Feature Reports');
const SOURCE_FILE = path.join(__dirname, '../references/SKILL.md');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'QA_Scripts_Reference.txt');

function saveReference() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SOURCE_FILE)) {
    console.warn('⚠ references/SKILL.md not found — skipping.');
    return;
  }

  const content   = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const timestamp = new Date().toLocaleString();
  const header = [
    '============================================================',
    '  CustomerConnect QA — Scripts & Commands Reference',
    `  Generated: ${timestamp}`,
    `  Project:   D:\\Claude\\QA_Projects\\CustomerConnect`,
    `  Reports:   Test Execution Report\\`,
    '============================================================',
    '', '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, header + content, 'utf-8');
  console.log(`✅ Reference saved: ${OUTPUT_FILE}`);
}

saveReference();
