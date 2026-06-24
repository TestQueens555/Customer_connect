const { test, expect } = require('@playwright/test');
const LoginPage     = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const config        = require('../utils/config');
const loginData     = require('../test-data/loginData');

test.describe('Login Module', () => {
  let loginPage, dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage     = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await page.goto('http://customerportal.dev-ts.online/Account/Logout');
    await page.waitForLoadState('networkidle');
    await loginPage.navigate(config.loginURL);
  });

  // ── UI ────────────────────────────────────────────────────────────────
  test('TC-LOGIN-001 | Login page loads with all UI elements',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Verify page title = Sign In', async () => {
        expect(await loginPage.getPageTitle()).toBe('Sign In');
      });
      await test.step('Verify username field visible', async () => {
        expect(await loginPage.isUsernameFieldVisible()).toBeTruthy();
      });
      await test.step('Verify password field visible', async () => {
        expect(await loginPage.isPasswordFieldVisible()).toBeTruthy();
      });
      await test.step('Verify Sign In button visible', async () => {
        expect(await loginPage.isSignInButtonVisible()).toBeTruthy();
      });
      await test.step('Verify Remember Me checkbox visible', async () => {
        expect(await loginPage.isRememberMeVisible()).toBeTruthy();
      });
    });

  // ── Positive ──────────────────────────────────────────────────────────
  test('TC-LOGIN-002 | Valid credentials redirect to dashboard',
    { tag: ['@smoke', '@critical'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Enter valid username', async () => {
        await loginPage.enterUsername(loginData.validUser.username);
      });
      await test.step('Enter valid password', async () => {
        await loginPage.enterPassword(loginData.validUser.password);
      });
      await test.step('Click Sign In', async () => {
        await loginPage.clickSignIn();
      });
      await test.step('Verify redirected to dashboard', async () => {
        await expect(page).not.toHaveURL(/Login/);
        expect(await page.title()).toContain('Dashboard');
      });
    });

  test('TC-LOGIN-003 | Login with Remember Me checked',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Enter credentials and check Remember Me', async () => {
        await loginPage.enterUsername(loginData.validUser.username);
        await loginPage.enterPassword(loginData.validUser.password);
        await loginPage.checkRememberMe();
        await loginPage.clickSignIn();
      });
      await test.step('Verify login successful', async () => {
        await expect(page).not.toHaveURL(/Login/);
      });
    });

  // ── Negative ──────────────────────────────────────────────────────────
  test('TC-LOGIN-004 | Invalid username shows error',
    { tag: ['@regression', '@negative'], annotation: [{ type: 'suite', description: 'Negative' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Login with invalid username', async () => {
        await loginPage.login(loginData.invalidUser.username, loginData.validUser.password);
      });
      await test.step('Verify stays on login page', async () => {
        await expect(page).toHaveURL(/Login/);
      });
      await test.step('Verify error: Invalid user name or password', async () => {
        expect(await loginPage.isErrorVisible()).toBeTruthy();
        expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
      });
    });

  test('TC-LOGIN-005 | Invalid password shows error',
    { tag: ['@regression', '@negative'], annotation: [{ type: 'suite', description: 'Negative' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Login with wrong password', async () => {
        await loginPage.login(loginData.validUser.username, loginData.invalidUser.password);
      });
      await test.step('Verify stays on login page', async () => {
        await expect(page).toHaveURL(/Login/);
      });
      await test.step('Verify error message', async () => {
        expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
      });
    });

  test('TC-LOGIN-006 | Empty username blocked',
    { tag: ['@regression', '@negative'], annotation: [{ type: 'suite', description: 'Negative' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Submit with empty username', async () => {
        await loginPage.login(loginData.emptyUser.username, loginData.validUser.password);
      });
      await test.step('Verify blocked — mandatory message shown', async () => {
        await expect(page).toHaveURL(/Login/);
        expect(await loginPage.getErrorMessage()).toContain('mandatory');
      });
    });

  test('TC-LOGIN-007 | Empty password blocked',
    { tag: ['@regression', '@negative'], annotation: [{ type: 'suite', description: 'Negative' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Submit with empty password', async () => {
        await loginPage.login(loginData.validUser.username, loginData.emptyUser.password);
      });
      await test.step('Verify blocked — mandatory message shown', async () => {
        await expect(page).toHaveURL(/Login/);
        expect(await loginPage.getErrorMessage()).toContain('mandatory');
      });
    });

  test('TC-LOGIN-008 | Both fields empty blocked',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Boundary' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Submit with both fields empty', async () => {
        await loginPage.login(loginData.emptyUser.username, loginData.emptyUser.password);
      });
      await test.step('Verify blocked', async () => {
        await expect(page).toHaveURL(/Login/);
        expect(await loginPage.getErrorMessage()).toContain('mandatory');
      });
    });

  // ── Security ──────────────────────────────────────────────────────────
  test('TC-LOGIN-009 | SQL injection rejected',
    { tag: ['@security'], annotation: [{ type: 'suite', description: 'Security' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Enter SQL injection as username', async () => {
        await loginPage.login(loginData.boundaryData.sqlInjection, loginData.validUser.password);
      });
      await test.step('Verify login rejected, no crash', async () => {
        await expect(page).toHaveURL(/Login/);
        const body = await page.evaluate(() => document.body.innerText.toLowerCase());
        expect(body).not.toContain('exception');
        expect(body).not.toContain('server error');
      });
    });

  test('TC-LOGIN-010 | XSS payload rejected',
    { tag: ['@security'], annotation: [{ type: 'suite', description: 'Security' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Enter XSS payload as username', async () => {
        await loginPage.login(loginData.boundaryData.xssPayload, loginData.validUser.password);
      });
      await test.step('Verify rejected, no script executed', async () => {
        await expect(page).toHaveURL(/Login/);
      });
    });

  // ── Boundary ──────────────────────────────────────────────────────────
  test('TC-LOGIN-011 | Max length username (256 chars) handled',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Boundary' }, { type: 'severity', description: 'medium' }] },
    async ({ page }) => {
      await test.step('Enter 256-character username', async () => {
        await loginPage.login(loginData.boundaryData.longUsername, loginData.validUser.password);
      });
      await test.step('Verify page does not crash', async () => {
        expect(await loginPage.getPageTitle()).toBeTruthy();
        await expect(page).toHaveURL(/Login/);
      });
    });

  test('TC-LOGIN-012 | Password field masks input',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Verify password input type = password', async () => {
        const type = await loginPage.getPasswordInputType();
        expect(type).toBe('password');
      });
    });

});
