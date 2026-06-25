// generate-login-reports.js
// Run: node generate-login-reports.js
// Generates Login.xlsx → Featurewise Test Report\
//          BugReport_DD-Mon-YYYY.xlsx → Daily Bug Report\

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const today    = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fileSafe = today.replace(/ /g, '-');
const ENV      = 'http://customerportal.dev-ts.online';

const FW_PATH = path.join(__dirname, 'Featurewise Test Report', 'Login.xlsx');
const DB_PATH = path.join(__dirname, 'Daily Bug Report', `BugReport_${fileSafe}.xlsx`);

// ── Test execution results (from live run 23-Jun-2026) ────────────────────
const tests = [
  ['TC-LOGIN-001','Valid login redirects to Support Dashboard','Login','Positive','Critical','User account exists and is active','1. Navigate to login page\n2. Enter username: sajith_xyz\n3. Enter password: User@123\n4. Click Sign In','Username: sajith_xyz | Password: User@123','User redirected to Support Dashboard (URL: /)','Redirected to Support Dashboard - Title: Support Dashboard - Support','PASS','Automation',today,'','Login successful'],
  ['TC-LOGIN-002','Wrong username and password shows error','Login','Negative','Critical','App accessible at login URL','1. Navigate to login page\n2. Enter username: wrong_user\n3. Enter password: WrongPass@999\n4. Click Sign In','Username: wrong_user | Password: WrongPass@999','Error message shown; stays on login page',"Stayed on login page. Error: 'Invalid user name or password'",'PASS','Automation',today,'','Correct error message displayed'],
  ['TC-LOGIN-003','Empty username and password shows validation','Login','Negative','Critical','App accessible at login URL','1. Navigate to login page\n2. Leave both fields empty\n3. Click Sign In','Username: (empty) | Password: (empty)','Validation message displayed; form not submitted',"Stayed on login page. Message: 'Username and Password are mandatory.'",'PASS','Automation',today,'','Client-side validation fires correctly'],
  ['TC-LOGIN-004','Valid username + empty password shows validation','Login','Negative','High','App accessible at login URL','1. Navigate to login page\n2. Enter username: sajith_xyz\n3. Leave password empty\n4. Click Sign In','Username: sajith_xyz | Password: (empty)',"Field-specific error: 'Password is required'",'Generic: Username and Password are mandatory. - no field-specific error','FAIL','Automation',today,'BUG-LOGIN-001','BUG-LOGIN-001: Generic error, not field-specific'],
  ['TC-LOGIN-005','Empty username + valid password shows validation','Login','Negative','High','App accessible at login URL','1. Navigate to login page\n2. Leave username empty\n3. Enter password: User@123\n4. Click Sign In','Username: (empty) | Password: User@123',"Field-specific error: 'Username is required'",'Generic: Username and Password are mandatory. - no field-specific error','FAIL','Automation',today,'BUG-LOGIN-001','BUG-LOGIN-001: Generic error, not field-specific'],
  ['TC-LOGIN-006','SQL injection in username is safely rejected','Login','Error Handling','Critical','App accessible at login URL',"1. Navigate to login page\n2. Enter username: ' OR 1=1 --\n3. Enter password: User@123\n4. Click Sign In","Username: ' OR 1=1 -- | Password: User@123","Login rejected; no SQL error exposed","Stayed on login. Error: 'Invalid user name or password'. No crash.",'PASS','Automation',today,'','SQL injection safely handled'],
  ['TC-LOGIN-007','XSS payload in username is safely rejected','Login','Error Handling','Critical','App accessible at login URL','1. Navigate to login page\n2. Enter XSS payload as username\n3. Enter password: User@123\n4. Click Sign In',"Username: <script>alert('xss')</script> | Password: User@123","Login rejected; no script executed","Stayed on login. Error: 'Invalid user name or password'. No script alert.",'PASS','Automation',today,'','XSS payload correctly sanitized'],
  ['TC-LOGIN-008','Valid username with wrong password shows error','Login','Negative','Critical','User account exists and is active','1. Navigate to login page\n2. Enter username: sajith_xyz\n3. Enter password: WrongPassword@999\n4. Click Sign In','Username: sajith_xyz | Password: WrongPassword@999','Error shown; stays on login page',"Stayed on login page. Error: 'Invalid user name or password'",'PASS','Automation',today,'','Correct rejection for valid user with wrong password'],
  ['TC-LOGIN-009','Whitespace-only password is rejected','Login','Boundary','Medium','App accessible at login URL',"1. Navigate to login page\n2. Enter username: sajith_xyz\n3. Enter '   ' (3 spaces) as password\n4. Click Sign In","Username: sajith_xyz | Password: '   ' (3 spaces)",'Login rejected; treated as empty/invalid',"Stayed on login page. Message: 'Username and Password are mandatory.'",'PASS','Automation',today,'','Whitespace password correctly rejected'],
  ['TC-LOGIN-010','Valid login with Remember Me checked','Login','Positive','High','User account exists and is active','1. Navigate to login page\n2. Enter username: sajith_xyz\n3. Enter password: User@123\n4. Check Remember Me\n5. Click Sign In','Username: sajith_xyz | Password: User@123 | Remember Me: checked','User redirected to dashboard; persistent session set','Redirected to Support Dashboard. Remember Me accepted.','PASS','Automation',today,'','Remember Me works correctly'],
  ['TC-LOGIN-011','Password visibility toggle reveals password text','Login','Positive','Medium','App accessible at login URL','1. Navigate to login page\n2. Enter password: User@123\n3. Click eye icon toggle button\n4. Observe password field type','Password: User@123',"Password field type changes from 'password' to 'text'","Password type changed: 'password' to 'text' after toggle click",'PASS','Automation',today,'','Password visibility toggle functional'],
  ['TC-LOGIN-012','All UI elements present on login page','Login','Positive','Medium','App accessible at login URL','1. Navigate to login page\n2. Verify: Logo, Forgot Password, Remember Me, Sign In button, Page title','N/A',"All elements visible; page title = 'Sign In'",'Logo OK | Forgot Password OK | Remember Me OK | Sign In OK | Title: Sign In','PASS','Automation',today,'','All expected UI elements present'],
];

const bugs = [
  ['BUG-LOGIN-001','Generic validation error does not identify which field is missing','Login','TC-LOGIN-004 / TC-LOGIN-005','Medium','P3',`${ENV} | Chrome | Windows`,'1. Navigate to login page\n2. Enter only username (leave password empty)\n3. Click Sign In\n4. Observe error message',"Field-specific: 'Password is required' or 'Username is required'","Generic: 'Username and Password are mandatory.' - no field-specific guidance",'New',today,'','Not Run','TC-LOGIN-004-failure.png','New bug - not yet in tracker. UX improvement needed.'],
];

const TC_HDRS   = ['Test Case ID','Test Case Name','Module','Test Type','Priority','Preconditions','Test Steps','Test Data','Expected Result','Actual Result','Status','Executed By','Execution Date','Defect ID','Remarks'];
const BUG_HDRS  = ['Bug ID','Title','Module','Linked TC ID','Severity','Priority','Environment','Steps to Reproduce','Expected Result','Actual Result','Status','Reported Date','Fixed Date','Regression Status','Screenshot / Evidence','Remarks'];
const DBUG_HDRS = ['Bug ID','Title','Module / Feature','Linked TC ID','Severity','Priority','Environment','Steps to Reproduce','Expected Result','Actual Result','Status','Reported Date','Reporter','Screenshot / Evidence','Bug Exists in Tracker','Tracker Bug ID','Tracker Status','Remarks'];

const passed = tests.filter(t => t[10] === 'PASS').length;
const failed = tests.filter(t => t[10] === 'FAIL').length;

function colWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ══════════════════════════════════════════════════════════════════
// 1. FEATUREWISE REPORT
// ══════════════════════════════════════════════════════════════════
const wb1   = XLSX.utils.book_new();

// Sheet 1 — Test Execution
const tcData = [
  [`LOGIN MODULE - FEATUREWISE TEST EXECUTION REPORT`],
  [`Environment: ${ENV}  |  Executed By: Automation  |  Date: ${today}  |  Browser: Chromium`],
  TC_HDRS,
  ...tests,
  [`SUMMARY: Total: ${tests.length}  |  PASS: ${passed}  |  FAIL: ${failed}  |  BLOCKED: 0  |  Pass Rate: ${(passed/tests.length*100).toFixed(1)}%`],
];
const ws1tc = XLSX.utils.aoa_to_sheet(tcData);
colWidths(ws1tc, [14,40,10,16,10,30,46,38,40,52,10,12,12,14,35]);
ws1tc['!merges'] = [
  { s:{r:0,c:0}, e:{r:0,c:14} },
  { s:{r:1,c:0}, e:{r:1,c:14} },
  { s:{r:tcData.length-1,c:0}, e:{r:tcData.length-1,c:14} },
];
XLSX.utils.book_append_sheet(wb1, ws1tc, 'Test Execution');

// Sheet 2 — Bug Report
const bugData = [
  [`LOGIN MODULE - BUG REPORT`],
  [`Environment: ${ENV} | Chrome | Windows  |  Reported: ${today}`],
  BUG_HDRS,
  ...bugs,
];
const ws1bug = XLSX.utils.aoa_to_sheet(bugData);
colWidths(ws1bug, [16,52,10,22,10,8,40,48,38,48,12,14,12,14,35,38]);
ws1bug['!merges'] = [
  { s:{r:0,c:0}, e:{r:0,c:15} },
  { s:{r:1,c:0}, e:{r:1,c:15} },
];
XLSX.utils.book_append_sheet(wb1, ws1bug, 'Bug Report');

XLSX.writeFile(wb1, FW_PATH);
console.log(`✅ Featurewise report: ${FW_PATH}`);

// ══════════════════════════════════════════════════════════════════
// 2. DAILY BUG REPORT
// ══════════════════════════════════════════════════════════════════
const wb2  = XLSX.utils.book_new();

// Sheet 1 — Daily Bug Report
const dbBugs = bugs.map(b => [
  b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9],
  b[10], b[11], 'QA Automation', b[14],
  'No', '', '', b[15],
]);
const dbData = [
  [`DAILY BUG REPORT - ${today}`],
  [`Environment: ${ENV} | Chrome | Windows  |  QA Engineer: Automation  |  Total Bugs: ${bugs.length}`],
  DBUG_HDRS,
  ...dbBugs,
];
const ws2db = XLSX.utils.aoa_to_sheet(dbData);
colWidths(ws2db, [18,52,16,22,10,8,40,48,38,50,12,14,16,40,20,16,16,38]);
ws2db['!merges'] = [
  { s:{r:0,c:0}, e:{r:0,c:17} },
  { s:{r:1,c:0}, e:{r:1,c:17} },
];
XLSX.utils.book_append_sheet(wb2, ws2db, 'Daily Bug Report');

// Sheet 2 — Test Summary
const sumData = [
  [`DAILY TEST EXECUTION SUMMARY - ${today}`],
  [`Environment: ${ENV}  |  Date: ${today}  |  Browser: Chromium`],
  ['Metric','Value','','Module','Pass','Fail','Blocked','Pass Rate'],
  ['Total Test Cases', tests.length,'','Login', passed, failed, 0, `${(passed/tests.length*100).toFixed(1)}%`],
  ['PASS', passed],
  ['FAIL', failed],
  ['BLOCKED', 0],
  ['Pass Rate', `${(passed/tests.length*100).toFixed(1)}%`],
  ['Total Bugs Found', bugs.length],
  ['New Bugs (not in tracker)', bugs.length],
  ['Execution Date', today],
  ['Executed By', 'Automation'],
  ['Environment', ENV],
];
const ws2sum = XLSX.utils.aoa_to_sheet(sumData);
colWidths(ws2sum, [28,20,4,18,10,10,10,14]);
ws2sum['!merges'] = [
  { s:{r:0,c:0}, e:{r:0,c:7} },
  { s:{r:1,c:0}, e:{r:1,c:7} },
];
XLSX.utils.book_append_sheet(wb2, ws2sum, 'Test Summary');

XLSX.writeFile(wb2, DB_PATH);
console.log(`✅ Daily bug report  : ${DB_PATH}`);
console.log(`\n📊 Login | Total: ${tests.length} | Pass: ${passed} | Fail: ${failed} | Pass Rate: ${(passed/tests.length*100).toFixed(1)}%`);
console.log(`🐛 Bugs logged: ${bugs.length}`);
