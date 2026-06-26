const fs = require('fs');
const path = require('path');

const src = 'D:\\Claude\\QA_Projects\\CustomerConnect\\Test Execution Report';
const dst = 'D:\\Claude\\QA_Projects\\CustomerConnect\\Test Execution Report from GitHub';

function copyDir(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const srcPath = path.join(s, entry.name);
    const dstPath = path.join(d, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, dstPath);
    else fs.copyFileSync(srcPath, dstPath);
  }
}

copyDir(src, dst);
console.log('Copied to: ' + dst);
console.log('Contents:', fs.readdirSync(dst));
