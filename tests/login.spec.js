const { test, expect } = require('@playwright/test');
const LoginPage  = require('../pages/LoginPage');
const config     = require('../utils/config');
const loginData  = require('../test-data/loginData');

test.describe('Login Module', () => {

  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.context().clearCookies();
    await loginPage.navigate(config.loginURL);
  });

  // ══════════════ POSITIVE ═══════════════════════════════════════════════════

  test('TC-LOGIN-001 | Valid credentials redirect to dashboard',
    { tag: ['@smoke', '@critical'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.validUser.password);
      await expect(page).not.toHaveURL(/Login/);
      expect(await page.title()).toContain('Dashboard');
    });

  test('TC-LOGIN-002 | Login page loads with all required UI elements',
    { tag: ['@smoke', '@ui'] },
    async ({ page }) => {
      expect(await page.title()).toBe('Sign In');
      await expect(page.locator('#UserName')).toBeVisible();
      await expect(page.locator('#Password')).toBeVisible();
      await expect(page.locator('#RememberMe')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

  test('TC-LOGIN-003 | Password field masked by default',
    { tag: ['@smoke', '@ui'] },
    async ({ page }) => {
      expect(await loginPage.getPasswordInputType()).toBe('password');
    });

  test('TC-LOGIN-004 | Password show/hide toggle changes input type',
    { tag: ['@regression'] },
    async ({ page }) => {
      expect(await loginPage.getPasswordInputType()).toBe('password');
      await loginPage.togglePasswordVisibility();
      expect(await loginPage.getPasswordInputType()).toBe('text');
    });

  test('TC-LOGIN-005 | Remember Me checkbox toggles checked/unchecked',
    { tag: ['@regression'] },
    async ({ page }) => {
      await page.locator('#RememberMe').check();
      expect(await page.locator('#RememberMe').isChecked()).toBeTruthy();
      await page.locator('#RememberMe').uncheck();
      expect(await page.locator('#RememberMe').isChecked()).toBeFalsy();
    });

  // ══════════════ NEGATIVE ═══════════════════════════════════════════════════

  test('TC-LOGIN-006 | Invalid username + password shows error',
    { tag: ['@smoke', '@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.invalidUser.username, loginData.invalidUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  test('TC-LOGIN-007 | Empty username + password — form blocked',
    { tag: ['@negative'] },
    async ({ page }) => {
      await loginPage.login('', '');
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-008 | Valid username + empty password — blocked',
    { tag: ['@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, '');
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-009 | Empty username + valid password — blocked',
    { tag: ['@negative'] },
    async ({ page }) => {
      await loginPage.login('', loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-010 | Wrong username + correct password — rejected',
    { tag: ['@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.invalidUser.username, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  test('TC-LOGIN-011 | Correct username + wrong password — rejected',
    { tag: ['@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.invalidUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  // ══════════════ BOUNDARY ═══════════════════════════════════════════════════

  test('TC-LOGIN-012 | 256-char username handled gracefully',
    { tag: ['@boundary'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.longUsername, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-013 | 256-char password handled gracefully',
    { tag: ['@boundary'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.boundaryData.longPassword);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-014 | Whitespace-only username rejected',
    { tag: ['@boundary'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.whitespaceOnly, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-015 | Special characters in username handled safely',
    { tag: ['@boundary'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.specialChars, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-016 | Username is case-insensitive (confirmed behaviour)',
    { tag: ['@boundary'] },
    async ({ page }) => {
      await loginPage.login('SAJITH_XYZ', loginData.validUser.password);
      await expect(page).not.toHaveURL(/Login/);
      expect(await page.title()).toContain('Dashboard');
    });

  // ══════════════ SECURITY ═══════════════════════════════════════════════════

  test('TC-LOGIN-017 | SQL injection in username handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.sqlInjection, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-018 | SQL injection in password handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.boundaryData.sqlInjectionPwd);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-019 | XSS payload in username handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.xssPayload, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-020 | Unauthenticated access redirects to login',
    { tag: ['@security'] },
    async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(`${config.baseURL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/Login/);
    });

});
