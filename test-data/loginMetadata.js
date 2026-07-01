// test-data/loginMetadata.js
// Human-readable TC metadata for the Login module.
// Consumed by utils/generate-report.js to populate Test Steps,
// Expected Result, Test Data, and Bug Steps to Reproduce fields.
// Add a matching file (e.g. dashboardMetadata.js) for every new module.

'use strict';

const LOGIN_URL = 'http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F';
const BASE_PRE  = 'Application accessible at http://customerportal.dev-ts.online; sajith_xyz account active';

module.exports = {

  'TC-LOGIN-001': {
    testData:       'Username: sajith_xyz | Password: User@123',
    preconditions:  BASE_PRE,
    steps:
      '1. Clear all browser cookies\n' +
      '2. Navigate to ' + LOGIN_URL + '\n' +
      '3. Enter username: sajith_xyz\n' +
      '4. Enter password: User@123\n' +
      '5. Click the Sign In button\n' +
      '6. Wait for navigation to complete\n' +
      '7. Verify URL = http://customerportal.dev-ts.online/\n' +
      '8. Verify page title contains \'Dashboard\'',
    expectedResult: 'User redirected to http://customerportal.dev-ts.online/; page title contains \'Dashboard\'',
    bugSteps:
      '1. Clear cookies\n' +
      '2. Navigate to login URL\n' +
      '3. Enter sajith_xyz / User@123\n' +
      '4. Click Sign In\n' +
      '5. Observe — no redirect to dashboard',
  },

  'TC-LOGIN-002': {
    testData:       'URL: ' + LOGIN_URL,
    preconditions:  'Application accessible at http://customerportal.dev-ts.online',
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Verify page title = \'Sign In\'\n' +
      '3. Verify #UserName input is visible\n' +
      '4. Verify #Password input is visible\n' +
      '5. Verify #RememberMe checkbox is visible\n' +
      '6. Verify Sign In button is visible',
    expectedResult: 'Page title = \'Sign In\'; all 4 elements visible: #UserName, #Password, #RememberMe, Sign In button',
    bugSteps:
      '1. Navigate to login URL\n' +
      '2. Inspect page for #UserName, #Password, #RememberMe, Sign In button\n' +
      '3. Note which element is missing',
  },


  'TC-LOGIN-003': {
    testData:       'Element: #Password | Attribute inspected: type',
    preconditions:  'Login page loaded in browser',
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Locate the #Password input element\n' +
      '3. Read the \'type\' attribute on page load (before any user interaction)\n' +
      '4. Verify type attribute = \'password\'',
    expectedResult: '#Password input type = \'password\' on initial page load; characters are masked',
    bugSteps:
      '1. Navigate to login URL\n' +
      '2. Inspect #Password element type attribute on load\n' +
      '3. Note the actual type value returned',
  },

  'TC-LOGIN-004': {
    testData:       'Toggle button: button[type="button"]:first-of-type (eye icon)',
    preconditions:  'Login page loaded in browser',
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Confirm #Password type = \'password\' before interaction\n' +
      '3. Click the eye icon toggle button (button[type="button"]:first)\n' +
      '4. Verify #Password type changes to \'text\'\n' +
      '5. Click the eye icon again\n' +
      '6. Verify #Password type reverts to \'password\'',
    expectedResult: 'Before click: type=\'password\'; After click: type=\'text\'; Toggle works bidirectionally',
    bugSteps:
      '1. Navigate to login URL\n' +
      '2. Click the eye icon toggle\n' +
      '3. Check #Password type attribute before and after click',
  },

  'TC-LOGIN-005': {
    testData:       'Element: #RememberMe checkbox',
    preconditions:  'Login page loaded in browser',
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Locate the #RememberMe checkbox\n' +
      '3. Click to check — verify isChecked = true\n' +
      '4. Click again to uncheck — verify isChecked = false',
    expectedResult: 'Checkbox toggles correctly: isChecked=true after check, isChecked=false after uncheck',
    bugSteps:
      '1. Navigate to login URL\n' +
      '2. Click #RememberMe checkbox\n' +
      '3. Check its checked state — then uncheck and check again',
  },

  'TC-LOGIN-006': {
    testData:       'Username: wrong_user | Password: WrongPass@999',
    preconditions:  BASE_PRE,
    steps:
      '1. Clear all browser cookies\n' +
      '2. Navigate to ' + LOGIN_URL + '\n' +
      '3. Enter username: wrong_user\n' +
      '4. Enter password: WrongPass@999\n' +
      '5. Click Sign In\n' +
      '6. Verify page stays on /Account/Login\n' +
      '7. Verify error message = \'Invalid user name or password\'',
    expectedResult: 'Page stays on /Account/Login; error message \'Invalid user name or password\' is displayed',
    bugSteps:
      '1. Clear cookies; navigate to login URL\n' +
      '2. Enter wrong_user / WrongPass@999\n' +
      '3. Click Sign In\n' +
      '4. Observe URL and error message shown',
  },


  'TC-LOGIN-007': {
    testData:       'Username: (empty) | Password: (empty)',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Leave both username and password fields empty\n' +
      '3. Click Sign In\n' +
      '4. Verify URL remains on /Account/Login?ReturnUrl=%2F\n' +
      '5. Verify form was not submitted',
    expectedResult: 'Form not submitted; page stays on /Account/Login?ReturnUrl=%2F; browser validation blocks empty submission',
    bugSteps: '1. Navigate to login URL\n2. Leave both fields empty\n3. Click Sign In\n4. Observe URL',
  },

  'TC-LOGIN-008': {
    testData:       'Username: sajith_xyz | Password: (empty)',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: sajith_xyz\n' +
      '3. Leave password field empty\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login?ReturnUrl=%2F\n' +
      '6. Verify user is not authenticated',
    expectedResult: 'Login blocked; page stays on /Account/Login?ReturnUrl=%2F; user not authenticated',
    bugSteps: '1. Enter valid username, leave password empty\n2. Click Sign In\n3. Observe URL and auth state',
  },

  'TC-LOGIN-009': {
    testData:       'Username: (empty) | Password: User@123',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Leave username field empty\n' +
      '3. Enter password: User@123\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login?ReturnUrl=%2F',
    expectedResult: 'Login blocked; page stays on /Account/Login?ReturnUrl=%2F; user not authenticated',
    bugSteps: '1. Leave username empty, enter valid password\n2. Click Sign In\n3. Observe URL',
  },

  'TC-LOGIN-010': {
    testData:       'Username: wrong_user | Password: User@123',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: wrong_user\n' +
      '3. Enter password: User@123 (valid password)\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login\n' +
      '6. Verify error message = \'Invalid user name or password\'',
    expectedResult: 'Login rejected; page stays on /Account/Login; error \'Invalid user name or password\' shown',
    bugSteps: '1. Enter wrong_user + valid password\n2. Click Sign In\n3. Observe URL and error message',
  },

  'TC-LOGIN-011': {
    testData:       'Username: sajith_xyz | Password: WrongPass@999',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: sajith_xyz (valid)\n' +
      '3. Enter password: WrongPass@999 (wrong)\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login\n' +
      '6. Verify error message = \'Invalid user name or password\'',
    expectedResult: 'Login rejected; page stays on /Account/Login; error \'Invalid user name or password\' shown',
    bugSteps: '1. Enter valid username + wrong password\n2. Click Sign In\n3. Observe URL and error message',
  },


  'TC-LOGIN-012': {
    testData:       "Username: 'a'×256 (256 chars) | Password: anything",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      "2. Enter 256-character string ('a'×256) into the username field\n" +
      '3. Enter any value in the password field\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login (no redirect)\n' +
      '6. Verify no HTTP 500 error and page title is not \'500\'',
    expectedResult: 'App handles oversized username gracefully; stays on /Account/Login; no 500 error or crash',
    bugSteps: "1. Enter 'a'×256 as username\n2. Click Sign In\n3. Check for 500 error or crash",
  },

  'TC-LOGIN-013': {
    testData:       "Username: sajith_xyz | Password: 'P@ssword'+'x'×248 (256 chars total)",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: sajith_xyz\n' +
      "3. Enter 256-character password ('P@ssword'+'x'×248) in password field\n" +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login\n' +
      "6. Verify no HTTP 500 error; page title does not contain '500'",
    expectedResult: 'App handles oversized password gracefully; stays on /Account/Login; no 500 error or crash',
    bugSteps: "1. Enter sajith_xyz + 256-char password\n2. Click Sign In\n3. Check for 500 error",
  },

  'TC-LOGIN-014': {
    testData:       "Username: '   ' (3 spaces — whitespace only) | Password: User@123",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      "2. Enter '   ' (3 spaces) in the username field\n" +
      '3. Enter password: User@123\n' +
      '4. Click Sign In\n' +
      '5. Verify user is not authenticated\n' +
      '6. Verify page stays on /Account/Login?ReturnUrl=%2F',
    expectedResult: 'Whitespace-only username not accepted; user not authenticated; stays on /Account/Login?ReturnUrl=%2F',
    bugSteps: "1. Enter '   ' (spaces) as username + valid password\n2. Click Sign In\n3. Check if authenticated",
  },

  'TC-LOGIN-015': {
    testData:       'Username: !@#$%^&*() (special chars) | Password: User@123',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      "2. Enter '!@#$%^&*()' in the username field\n" +
      '3. Enter password: User@123\n' +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login\n' +
      '6. Verify no HTTP 500 error or crash',
    expectedResult: "Special characters handled safely; stays on /Account/Login; no 500 error; page title is 'Sign In'",
    bugSteps: "1. Enter '!@#$%^&*()' as username\n2. Click Sign In\n3. Check for server error or crash",
  },

  'TC-LOGIN-016': {
    testData:       'Username: SAJITH_XYZ (all uppercase) | Password: User@123',
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: SAJITH_XYZ (all uppercase)\n' +
      '3. Enter password: User@123\n' +
      '4. Click Sign In\n' +
      '5. Observe result — does login succeed or fail?\n' +
      '6. Document whether the app enforces username case sensitivity',
    expectedResult: 'Behaviour documented; app may or may not enforce case sensitivity; no crash expected',
    bugSteps: '1. Enter SAJITH_XYZ (uppercase) + valid password\n2. Click Sign In\n3. Record result',
  },


  'TC-LOGIN-017': {
    testData:       "Username: ' OR 1=1 -- (SQL injection) | Password: anything",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      "2. Enter SQL injection payload in username: ' OR 1=1 --\n" +
      '3. Enter any value in password field\n' +
      '4. Click Sign In using JavaScript click (server response may take 4–6 s)\n' +
      '5. Wait up to 15 s for server response\n' +
      '6. Verify page stays on /Account/Login (no redirect to dashboard)\n' +
      '7. Verify no HTTP 500 SQL error is displayed\n' +
      '8. Verify authentication was not bypassed',
    expectedResult: 'SQL injection rejected; stays on /Account/Login; no SQL error exposed; authentication not bypassed',
    bugSteps:
      "1. Enter ' OR 1=1 -- as username\n" +
      '2. Click Sign In (JS click — allow 4–6 s)\n' +
      '3. Check URL, page title, and any error messages for SQL bypass or 500',
  },

  'TC-LOGIN-018': {
    testData:       "Username: sajith_xyz | Password: ' OR '1'='1 (SQL injection)",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      '2. Enter username: sajith_xyz\n' +
      "3. Enter SQL injection payload in password: ' OR '1'='1\n" +
      '4. Click Sign In\n' +
      '5. Verify page stays on /Account/Login\n' +
      '6. Verify authentication was not bypassed\n' +
      '7. Verify no SQL error is displayed',
    expectedResult: 'SQL injection in password rejected; authentication not bypassed; stays on /Account/Login; no SQL error',
    bugSteps:
      "1. Enter sajith_xyz + ' OR '1'='1 as password\n" +
      '2. Click Sign In\n' +
      '3. Check URL and auth state for SQL bypass',
  },

  'TC-LOGIN-019': {
    testData:       "Username: <script>alert('xss')</script> | Password: anything",
    preconditions:  BASE_PRE,
    steps:
      '1. Navigate to ' + LOGIN_URL + '\n' +
      "2. Enter XSS payload in username: <script>alert('xss')</script>\n" +
      '3. Enter any value in password field\n' +
      '4. Click Sign In\n' +
      '5. Verify no JavaScript alert dialog fires in the browser\n' +
      '6. Verify page stays on /Account/Login\n' +
      '7. Verify no HTTP 500 error',
    expectedResult: 'XSS payload not executed; no JS alert fires; page stays on /Account/Login; input treated as plain text',
    bugSteps:
      "1. Enter <script>alert('xss')</script> as username\n" +
      '2. Click Sign In\n' +
      '3. Observe whether a JS alert dialog fires',
  },

  'TC-LOGIN-020': {
    testData:       'Session: cleared | Direct target URL: http://customerportal.dev-ts.online/',
    preconditions:  'No active session (all cookies cleared)',
    steps:
      '1. Clear all cookies using page.context().clearCookies()\n' +
      '2. Navigate directly to http://customerportal.dev-ts.online/ (dashboard URL)\n' +
      '3. Wait for navigation to complete\n' +
      '4. Verify URL changes to /Account/Login?ReturnUrl=%2F\n' +
      '5. Verify the login page is displayed (auth guard redirect active)',
    expectedResult: 'Unauthenticated direct access blocked; redirected to /Account/Login?ReturnUrl=%2F; auth guard confirmed',
    bugSteps:
      '1. Clear all cookies\n' +
      '2. Navigate directly to dashboard URL\n' +
      '3. Check whether redirect to login page occurs',
  },

};
