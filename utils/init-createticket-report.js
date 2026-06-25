// Script to initialize CreateTicket.xlsx with two blank sheets
const XLSX = require('xlsx');
const path = require('path');

const featurePath = 'D:\\Claude\\QA_Projects\\CustomerConnect\\Featurewise Test Report\\CreateTicket.xlsx';
const dailyPath   = 'D:\\Claude\\QA_Projects\\CustomerConnect\\Daily Bug Report\\BugReport_26-Jun-2026.xlsx';

function createBlank(filePath) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['']]), 'Test Execution');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['']]), 'Bug Report');
  XLSX.writeFile(wb, filePath);
  console.log('Created:', filePath);
}

createBlank(featurePath);

// Only create daily if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(dailyPath)) {
  createBlank(dailyPath);
  console.log('Created daily:', dailyPath);
} else {
  console.log('Daily exists:', dailyPath);
}
