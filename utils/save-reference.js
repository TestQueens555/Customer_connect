// utils/save-reference.js
// Reads references/SKILL.md and saves it as QA_Scripts_Reference.txt
// into the Featurewise Test Report folder.
// Usage: node utils/save-reference.js

const fs   = require('fs');
const path = require('path');

const OUTPUT_DIR   = path.join(__dirname, '../Featurewise Test Report');
const SOURCE_FILE  = path.join(__dirname, '../references/SKILL.md');
const OUTPUT_FILE  = path.join(OUTPUT_DIR, 'QA_Scripts_Reference.txt');

function saveReference() {
  // Ensure output folder exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error('❌ references/SKILL.md not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(SOURCE_FILE, 'utf-8');

  // Add generated header
  const timestamp = new Date().toLocaleString();
  const header = [
    '============================================================',
    '  CustomerConnect QA — Scripts & Commands Reference',
    `  Generated: ${timestamp}`,
    `  Project:   D:\\Claude\\QA_Projects\\CustomerConnect`,
    `  Reports:   D:\\Claude\\QA_Projects\\CustomerConnect\\Featurewise Test Report\\`,
    '============================================================',
    '',
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, header + content, 'utf-8');

  console.log(`\n✅ Reference document saved to:`);
  console.log(`   ${OUTPUT_FILE}`);
}

saveReference();
