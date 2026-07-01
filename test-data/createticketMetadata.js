// test-data/createTicketMetadata.js
// Human-readable TC metadata for the CreateTicket module.
// Loaded by utils/generate-report.js to populate Test Steps,
// Expected Result, Test Data, Preconditions, and Bug Steps fields.

'use strict';

const BASE_URL = 'http://customerportal.dev-ts.online/Ticket/Create';
const PRE_AUTH = 'User logged in as sajith_xyz; on Create Ticket page (/Ticket/Create)';
const PRE_APP  = 'Application accessible at http://customerportal.dev-ts.online; sajith_xyz account active';

module.exports = {

  'TC-CT-001': {
    preconditions:  PRE_APP,
    testData:       'Project: PRJ0008 - YSG Inventory | Type: New | Platform: Backend | Desc: 112-char valid text',
    steps:
      '1. Login as sajith_xyz / User@123\n' +
      '2. Navigate to ' + BASE_URL + '\n' +
      '3. Select project: PRJ0008 - YSG Inventory\n' +
      '4. Click the \'New\' ticket type chip\n' +
      '5. Click the \'Backend\' platform chip\n' +
      '6. Enter description (112 chars): \'This is a test ticket created by automated QA testing...\'\n' +
      '7. Click Submit Ticket button\n' +
      '8. Click \'Yes, Submit\' on the confirmation dialog\n' +
      '9. Observe success dialog and redirect',
    expectedResult:
      '\'Ticket Submitted!\' success dialog shown; ' +
      'redirected to /Ticket/Index after clicking \'Great!\'',
    bugSteps:
      '1. Login and navigate to /Ticket/Create\n' +
      '2. Fill all required fields with valid data\n' +
      '3. Click Submit Ticket → \'Yes, Submit\'\n' +
      '4. Observe — \'Ticket Submitted!\' dialog should appear',
  },

  'TC-CT-002': {
    preconditions:  PRE_AUTH,
    testData:       'Project: PRJ0021 - YSG Loyalty | Page Name: Dashboard | Type: Improvement | Platform: General',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select project: PRJ0021 - YSG Loyalty\n' +
      '3. Enter Page/Screen Name: \'Dashboard\'\n' +
      '4. Click \'Improvement\' type chip\n' +
      '5. Click \'General\' platform chip\n' +
      '6. Enter description: \'Minimal valid ticket with exactly fifteen chars.\'\n' +
      '7. Click Submit Ticket → \'Yes, Submit\'',
    expectedResult:
      'Ticket submitted successfully including Page/Screen Name; \'Ticket Submitted!\' dialog shown',
    bugSteps:
      '1. Fill all required fields + Page/Screen Name\n' +
      '2. Click Submit Ticket → \'Yes, Submit\'\n' +
      '3. Observe success dialog',
  },

  'TC-CT-003': {
    preconditions:  PRE_AUTH,
    testData:       'Chips: New | Improvement | System Issue | Operational Issue | SCR | Not Feasible',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Click each type chip: New, Improvement, System Issue, Operational Issue, SCR, Not Feasible\n' +
      '3. Verify each chip toggles to selected state (CSS class change) after click\n' +
      '4. Deselect each chip after verification',
    expectedResult:
      'Each of the 6 type chips toggles to selected state when clicked; deselects on second click',
    bugSteps:
      '1. Click each type chip in turn\n' +
      '2. Verify selected CSS class applied\n' +
      '3. Note which chip(s) fail to select',
  },


  'TC-CT-004': {
    preconditions:  PRE_AUTH,
    testData:       'Chips: Backend | SFA Web Service | Android | Web Service | Integration | General | Testing',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Click each platform chip: Backend, SFA Web Service, Android, Web Service, Integration, General, Testing\n' +
      '3. Verify each chip toggles to selected state\n' +
      '4. Deselect each chip after verification',
    expectedResult:
      'All 7 platform chips toggle to selected state when clicked',
    bugSteps:
      '1. Click each platform chip\n' +
      '2. Verify selected state\n' +
      '3. Note which chip(s) fail to select',
  },

  'TC-CT-005': {
    preconditions:  PRE_AUTH,
    testData:       'Reset confirmation dialog; all fields post-reset',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Enter Page/Screen Name: \'Test Page\'\n' +
      '3. Enter Description: \'Filled description\'\n' +
      '4. Click the Reset button\n' +
      '5. Verify \'Reset Form?\' confirmation dialog appears\n' +
      '6. Click the confirm/Yes button\n' +
      '7. Verify all fields are cleared',
    expectedResult:
      '\'Reset Form?\' dialog shown; after confirm: desc=\'\', pageName=\'\', counter=\'0/2000\', project=\'\'',
    bugSteps:
      '1. Fill some fields then click Reset\n' +
      '2. Confirm in the dialog\n' +
      '3. Observe which fields are not cleared',
  },

  'TC-CT-006': {
    preconditions:  PRE_AUTH,
    testData:       'Text: \'Testing counter update!\' (23 chars)',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Observe description counter shows \'0 / 2000\'\n' +
      '3. Click in the Description textarea\n' +
      '4. Type: \'Testing counter update!\'\n' +
      '5. Observe the counter value below the textarea',
    expectedResult:
      'Counter starts at \'0 / 2000\'; updates dynamically to current character count as user types',
    bugSteps:
      '1. Type in description field\n' +
      '2. Check if counter updates in real-time\n' +
      '3. Note if counter remains static',
  },

  'TC-CT-007': {
    preconditions:  PRE_APP,
    testData:       'URL: ' + BASE_URL,
    steps:
      '1. Login as sajith_xyz\n' +
      '2. Navigate to ' + BASE_URL + '\n' +
      '3. Verify page title = \'Create Ticket - Support\'\n' +
      '4. Verify h1 heading = \'Create New Ticket\'\n' +
      '5. Verify Submit Ticket button is visible\n' +
      '6. Verify Reset button is visible\n' +
      '7. Verify #txtDescription textarea is visible\n' +
      '8. Verify #descCount counter shows \'0 / 2000\'\n' +
      '9. Verify #txtPageName input is visible',
    expectedResult:
      'title=\'Create Ticket - Support\'; h1=\'Create New Ticket\'; Submit/Reset/Desc/Counter/PageName all visible; counter=\'0/2000\'',
    bugSteps:
      '1. Navigate to /Ticket/Create\n' +
      '2. Check for missing or incorrect UI elements\n' +
      '3. Note which elements are not visible',
  },

  'TC-CT-008': {
    preconditions:  PRE_AUTH,
    testData:       'Project: (empty) | Type: New | Platform: Backend | Desc: valid',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select Ticket Type: New\n' +
      '3. Select Platform: Backend\n' +
      '4. Enter valid description (>15 chars)\n' +
      '5. Leave Project field empty\n' +
      '6. Click Submit Ticket',
    expectedResult:
      '\'Missing Information\' dialog: \'Please provide the following mandatory details: Project\'',
    bugSteps:
      '1. Fill type/platform/desc but leave project empty\n' +
      '2. Click Submit Ticket\n' +
      '3. Observe if validation error appears for Project',
  },


  'TC-CT-009': {
    preconditions: PRE_AUTH,
    testData: 'Project: PRJ0008 | Type: (none) | Platform: Backend | Desc: valid',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select Project: PRJ0008 - YSG Inventory\n' +
      '3. Select Platform: Backend\n' +
      '4. Enter valid description (>15 chars)\n' +
      '5. Leave Ticket Type unselected\n' +
      '6. Click Submit Ticket',
    expectedResult: '\'Missing Information\' dialog: \'Please provide: Ticket Type\'',
    bugSteps: '1. Fill project/platform/desc but leave ticket type empty\n2. Click Submit\n3. Check validation',
  },

  'TC-CT-010': {
    preconditions: PRE_AUTH,
    testData: 'Project: PRJ0008 | Type: New | Platform: (none) | Desc: valid',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select Project and Ticket Type: New\n' +
      '3. Enter valid description\n' +
      '4. Leave Platform unselected\n' +
      '5. Click Submit Ticket',
    expectedResult: '\'Missing Information\' dialog: \'Please provide: Platform\'',
    bugSteps: '1. Fill project/type/desc but leave platform empty\n2. Click Submit\n3. Check validation',
  },

  'TC-CT-011': {
    preconditions: PRE_AUTH,
    testData: 'Project: PRJ0008 | Type: New | Platform: Backend | Desc: (empty)',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select Project, Ticket Type: New, Platform: Backend\n' +
      '3. Leave Description field empty\n' +
      '4. Click Submit Ticket',
    expectedResult: '\'Missing Information\' dialog: \'Please provide: Description (min 15 chars)\'',
    bugSteps: '1. Fill project/type/platform but leave description empty\n2. Click Submit\n3. Check validation',
  },

  'TC-CT-012': {
    preconditions: PRE_AUTH,
    testData: "Description: '14charsonly!!!' — 14 characters (below 15 minimum)",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter description: \'14charsonly!!!\' (14 chars)\n' +
      '4. Click Submit Ticket',
    expectedResult: '\'Missing Information\' → \'Description (min 15 chars)\'; form not submitted',
    bugSteps: "1. Enter 14-char description\n2. Click Submit\n3. Check if below-minimum is accepted",
  },

  'TC-CT-013': {
    preconditions: PRE_AUTH,
    testData: 'All fields: (empty)',
    steps:
      '1. Navigate to ' + BASE_URL + ' (all fields empty on load)\n' +
      '2. Click Submit Ticket immediately without filling any field\n' +
      '3. Observe validation dialog',
    expectedResult:
      '\'Missing Information\' dialog listing all 4 missing fields: ' +
      'Project, Ticket Type, Description (min 15 chars), Platform',
    bugSteps: '1. Navigate to form\n2. Click Submit without filling anything\n3. Check all validations shown',
  },

  'TC-CT-014': {
    preconditions: PRE_AUTH,
    testData: "Description: 'Test15CharsOnly' — exactly 15 characters",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter exactly 15-character description: \'Test15CharsOnly\'\n' +
      '4. Verify counter shows \'15 / 2000\'\n' +
      '5. Click Submit Ticket',
    expectedResult:
      '15-char description accepted; counter=\'15/2000\'; \'Submit Ticket?\' confirmation dialog shown',
    bugSteps: '1. Enter exactly 15 chars\n2. Click Submit\n3. Check if minimum boundary is accepted',
  },

  'TC-CT-015': {
    preconditions: PRE_AUTH,
    testData: "Description: '14charsonly!!!' — exactly 14 characters",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter exactly 14-character description: \'14charsonly!!!\'\n' +
      '4. Click Submit Ticket',
    expectedResult: 'Validation error shown; 14-char description rejected; form not submitted',
    bugSteps: '1. Enter 14-char description\n2. Click Submit\n3. Check if below-min boundary is rejected',
  },


  'TC-CT-016': {
    preconditions: PRE_AUTH,
    testData: "Description: 'A'×2000 — exactly 2000 characters",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter exactly 2000 \'A\' characters in Description\n' +
      '4. Verify counter shows \'2000 / 2000\'\n' +
      '5. Click Submit Ticket',
    expectedResult:
      'Counter=\'2000/2000\'; form accepts 2000-char description; \'Submit Ticket?\' dialog shown',
    bugSteps: '1. Enter 2000 chars\n2. Click Submit\n3. Check max boundary acceptance',
  },

  'TC-CT-017': {
    preconditions: PRE_AUTH,
    testData: "Description: 'A'×2001 — 1 char over the 2000 max shown in UI",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter 2001 \'A\' characters in Description\n' +
      '4. Observe counter value\n' +
      '5. Click Submit Ticket\n' +
      '6. Observe whether submission is blocked',
    expectedResult:
      'Input truncated to 2000 chars OR submission blocked with validation error; counter should not exceed 2000/2000',
    bugSteps:
      '1. Enter 2001 chars in description\n' +
      '2. Note counter shows \'2001 / 2000\'\n' +
      '3. Click Submit Ticket\n' +
      '4. Observe — \'Submit Ticket?\' confirm appears; ticket submits with 2001 chars\n' +
      '5. No server-side max-length enforcement present',
  },

  'TC-CT-018': {
    preconditions: PRE_AUTH,
    testData: "Page/Screen Name: 'A'×300 (300 characters)",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields with valid description\n' +
      '3. Enter 300-character string in Page/Screen Name field\n' +
      '4. Click Submit Ticket → confirm',
    expectedResult:
      'App handles 300-char page name; no crash or 500 error; ticket submitted successfully',
    bugSteps: '1. Enter 300-char page name\n2. Submit ticket\n3. Check for crash or 500 error',
  },

  'TC-CT-019': {
    preconditions: 'No active session (HttpOnly cookies cleared)',
    testData: 'Session: cleared | Direct target URL: ' + BASE_URL,
    steps:
      '1. Clear all session cookies (page.context().clearCookies())\n' +
      '2. Navigate directly to ' + BASE_URL + '\n' +
      '3. Observe redirect behaviour\n' +
      '4. Verify URL changes to /Account/Login',
    expectedResult:
      'Unauthenticated direct access blocked; redirected to /Account/Login; auth guard active',
    bugSteps: '1. Clear cookies\n2. Navigate directly to /Ticket/Create\n3. Check if redirect to login occurs',
  },

  'TC-CT-020': {
    preconditions: PRE_AUTH,
    testData: "Description: ' OR 1=1 --; DROP TABLE tickets; SELECT * FROM users;",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter SQL injection payload in Description\n' +
      '4. Click Submit Ticket → confirm\n' +
      '5. Verify no SQL error or server crash',
    expectedResult:
      'SQL payload submitted safely; no SQL error or data leak; no server crash; ticket submitted normally',
    bugSteps: '1. Enter SQL injection in description\n2. Submit\n3. Check for SQL errors or 500',
  },

  'TC-CT-021': {
    preconditions: PRE_AUTH,
    testData: "Description: <script>alert('xss')</script>",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      "3. Enter XSS payload in Description: <script>alert('xss')</script>\n" +
      '4. Override window.alert to detect execution\n' +
      '5. Click Submit Ticket → confirm\n' +
      '6. Verify no JS alert dialog fires',
    expectedResult:
      'XSS payload submitted as plain text; no JS alert fires; input not executed in browser',
    bugSteps: "1. Enter <script>alert('xss')</script>\n2. Submit\n3. Check if alert fires",
  },

  'TC-CT-022': {
    preconditions: PRE_AUTH,
    testData: 'Description: <img src=x onerror=alert(1)>',
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields\n' +
      '3. Enter HTML injection payload in Description: <img src=x onerror=alert(1)>\n' +
      '4. Override window.alert to detect execution\n' +
      '5. Click Submit Ticket → confirm',
    expectedResult:
      'HTML injection not executed; no alert fires; payload stored as plain text',
    bugSteps: '1. Enter <img src=x onerror=alert(1)> in description\n2. Submit\n3. Check if alert fires',
  },

  'TC-CT-023': {
    preconditions: PRE_AUTH,
    testData: "Page/Screen Name: <script>alert('xss')</script>",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select all required fields with valid description\n' +
      "3. Enter XSS payload in Page/Screen Name: <script>alert('xss')</script>\n" +
      '4. Override window.alert to detect execution\n' +
      '5. Click Submit Ticket → confirm',
    expectedResult:
      'XSS in page name not executed; no JS alert fires',
    bugSteps: "1. Enter XSS payload in page name\n2. Submit\n3. Check if alert fires",
  },

  'TC-CT-024': {
    preconditions: PRE_AUTH,
    testData: "Description: 'This text should remain after cancel reset click test.'",
    steps:
      '1. Navigate to ' + BASE_URL + '\n' +
      '2. Select Project, Type, Platform; enter description\n' +
      '3. Click Reset button\n' +
      '4. Verify \'Reset Form?\' dialog appears\n' +
      '5. Click \'Wait, let me check\' / cancel button\n' +
      '6. Verify all previously entered fields are still populated',
    expectedResult:
      '\'Reset Form?\' dialog dismisses on cancel; form fields remain unchanged; no data lost',
    bugSteps: '1. Fill form\n2. Click Reset\n3. Click Cancel\n4. Check if fields are retained',
  },

};
