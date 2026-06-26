const { test, expect } = require('@playwright/test');
const LoginPage     = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const config        = require('../utils/config');
const loginData     = require('../test-data/loginData');

// Pipeline verification run — 26-Jun-2026 | 20/20 PASS confirmed
test.describe('Login Module', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.context().clearCookies();
    await loginPage.navigate(config.loginURL);
  });

  // ── Positive ───────────────────────────────────────────────────────────────

  test('TC-LOGIN-001 | Valid login redirects to dashboard',
    { tag: ['@smoke', '@critical'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.validUser.password);
      await expect(page).not.toHaveURL(/Login/);
      expect(await page.title()).toContain('Dashboard');
    });

  test('TC-LOGIN-002 | Login page loads with all required fields',
    { tag: ['@smoke', '@ui'] },
    async ({ page }) => {
      expect(await page.title()).toBe('Sign In');
      expect(await loginPage.isUsernameFieldVisible()).toBeTruthy();
      expect(await loginPage.isPasswordFieldVisible()).toBeTruthy();
      expect(await loginPage.isRememberMeVisible()).toBeTruthy();
      expect(await loginPage.isSignInButtonVisible()).toBeTruthy();
    });

  test('TC-LOGIN-003 | Password field is masked by default',
    { tag: ['@smoke', '@ui'] },
    async ({ page }) => {
      expect(await loginPage.getPasswordInputType()).toBe('password');
    });

  test('TC-LOGIN-004 | Password show/hide toggle works',
    { tag: ['@regression'] },
    async ({ page }) => {
      expect(await loginPage.getPasswordInputType()).toBe('password');
      await loginPage.togglePasswordVisibility();
      expect(await loginPage.getPasswordInputType()).toBe('text');
    });

  test('TC-LOGIN-005 | Remember Me checkbox toggles correctly',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.checkRememberMe();
      expect(await page.locator('#RememberMe').isChecked()).toBeTruthy();
      await page.locator('#RememberMe').uncheck();
      expect(await page.locator('#RememberMe').isChecked()).toBeFalsy();
    });

  // ── Negative ───────────────────────────────────────────────────────────────

  test('TC-LOGIN-006 | Invalid credentials shows error message',
    { tag: ['@smoke', '@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.invalidUser.username, loginData.invalidUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  test('TC-LOGIN-007 | Empty username and password blocked',
    { tag: ['@regression', '@negative'] },
    async ({ page }) => {
      await loginPage.login('', '');
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-008 | Valid username with empty password blocked',
    { tag: ['@regression', '@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, '');
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-009 | Empty username with valid password blocked',
    { tag: ['@regression', '@negative'] },
    async ({ page }) => {
      await loginPage.login('', loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-010 | Wrong username with correct password rejected',
    { tag: ['@regression', '@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.invalidUser.username, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  test('TC-LOGIN-011 | Correct username with wrong password rejected',
    { tag: ['@regression', '@negative'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.invalidUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });

  // ── Boundary ───────────────────────────────────────────────────────────────

  test('TC-LOGIN-012 | Username with 256 characters handled gracefully',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.longUsername, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-013 | Password with 256 characters handled gracefully',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.boundaryData.longPassword);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-014 | Whitespace-only username is rejected',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.whitespaceOnly, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-015 | Special characters in username handled safely',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.specialChars, loginData.validUser.password);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  // ── Security ───────────────────────────────────────────────────────────────

  test('TC-LOGIN-016 | SQL injection in username handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.sqlInjection, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-017 | SQL injection in password handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.validUser.username, loginData.boundaryData.sqlInjectionPwd);
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-018 | XSS payload in username handled safely',
    { tag: ['@security'] },
    async ({ page }) => {
      await loginPage.login(loginData.boundaryData.xssPayload, 'anything');
      await expect(page).toHaveURL(/Login/);
      expect(await page.title()).not.toContain('500');
    });

  test('TC-LOGIN-019 | Unauthenticated access redirects to login',
    { tag: ['@security'] },
    async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('http://customerportal.dev-ts.online/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/Login/);
    });

  test('TC-LOGIN-020 | Username login is case-insensitive (behaviour confirmed)',
    { tag: ['@regression'] },
    async ({ page }) => {
      await loginPage.login('SAJITH_XYZ', loginData.validUser.password);
      // App is NOT case-sensitive — SAJITH_XYZ logs in successfully
      await expect(page).not.toHaveURL(/Login/);
    });
});
