const { test, expect } = require('@playwright/test');
const { allure }       = require('allure-playwright');
const LoginPage        = require('../pages/LoginPage');
const DashboardPage    = require('../pages/DashboardPage');
const config           = require('../utils/config');
const loginData        = require('../test-data/loginData');

test.describe('Login Module — E2E Tests', () => {
  let loginPage, dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage     = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    // Clear session before each test
    await page.goto('http://customerportal.dev-ts.online/Account/Logout');
    await page.waitForLoadState('networkidle');
    await loginPage.navigate(config.loginURL);
  });

  // ── UI Tests ──────────────────────────────────────────────────────────
  test('TC-LOGIN-001 | Login page loads with all UI elements @smoke @ui', async ({ page }) => {
    await allure.label('suite', 'UI');
    await allure.label('severity', 'critical');
    await allure.step('Verify page title = Sign In', async () => {
      expect(await loginPage.getPageTitle()).toBe('Sign In');
    });
    await allure.step('Verify username field visible', async () => {
      expect(await loginPage.isUsernameFieldVisible()).toBeTruthy();
    });
    await allure.step('Verify password field visible', async () => {
      expect(await loginPage.isPasswordFieldVisible()).toBeTruthy();
    });
    await allure.step('Verify Sign In button visible', async () => {
      expect(await loginPage.isSignInButtonVisible()).toBeTruthy();
    });
    await allure.step('Verify Remember Me checkbox visible', async () => {
      expect(await loginPage.isRememberMeVisible()).toBeTruthy();
    });
  });

  // ── Positive Tests ────────────────────────────────────────────────────
  test('TC-LOGIN-002 | Valid credentials redirect to dashboard @smoke @critical', async ({ page }) => {
    await allure.label('suite', 'Positive');
    await allure.label('severity', 'critical');
    await allure.step('Enter valid username', async () => {
      await loginPage.enterUsername(loginData.validUser.username);
    });
    await allure.step('Enter valid password', async () => {
      await loginPage.enterPassword(loginData.validUser.password);
    });
    await allure.step('Click Sign In', async () => {
      await loginPage.clickSignIn();
    });
    await allure.step('Verify redirected to dashboard', async () => {
      await expect(page).not.toHaveURL(/Login/);
      expect(await page.title()).toContain('Dashboard');
    });
  });

  test('TC-LOGIN-003 | Login with Remember Me checked @regression', async ({ page }) => {
    await allure.label('suite', 'Positive');
    await allure.label('severity', 'high');
    await allure.step('Enter credentials and check Remember Me', async () => {
      await loginPage.enterUsername(loginData.validUser.username);
      await loginPage.enterPassword(loginData.validUser.password);
      await loginPage.checkRememberMe();
      await loginPage.clickSignIn();
    });
    await allure.step('Verify login successful', async () => {
      await expect(page).not.toHaveURL(/Login/);
    });
  });

  // ── Negative Tests ────────────────────────────────────────────────────
  test('TC-LOGIN-004 | Invalid username shows error @regression @negative', async ({ page }) => {
    await allure.label('suite', 'Negative');
    await allure.label('severity', 'critical');
    await allure.step('Login with invalid username', async () => {
      await loginPage.login(loginData.invalidUser.username, loginData.validUser.password);
    });
    await allure.step('Verify stays on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    await allure.step('Verify error message: Invalid user name or password', async () => {
      expect(await loginPage.isErrorVisible()).toBeTruthy();
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });
  });

  test('TC-LOGIN-005 | Invalid password shows error @regression @negative', async ({ page }) => {
    await allure.label('suite', 'Negative');
    await allure.label('severity', 'critical');
    await allure.step('Login with wrong password', async () => {
      await loginPage.login(loginData.validUser.username, loginData.invalidUser.password);
    });
    await allure.step('Verify stays on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    await allure.step('Verify error message', async () => {
      expect(await loginPage.getErrorMessage()).toContain('Invalid user name or password');
    });
  });

  test('TC-LOGIN-006 | Empty username blocked @regression @negative', async ({ page }) => {
    await allure.label('suite', 'Negative');
    await allure.label('severity', 'high');
    await allure.step('Submit with empty username', async () => {
      await loginPage.login(loginData.emptyUser.username, loginData.validUser.password);
    });
    await allure.step('Verify blocked with mandatory message', async () => {
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('mandatory');
    });
  });

  test('TC-LOGIN-007 | Empty password blocked @regression @negative', async ({ page }) => {
    await allure.label('suite', 'Negative');
    await allure.label('severity', 'high');
    await allure.step('Submit with empty password', async () => {
      await loginPage.login(loginData.validUser.username, loginData.emptyUser.password);
    });
    await allure.step('Verify blocked with mandatory message', async () => {
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('mandatory');
    });
  });

  test('TC-LOGIN-008 | Both fields empty blocked @regression', async ({ page }) => {
    await allure.label('suite', 'Boundary');
    await allure.label('severity', 'high');
    await allure.step('Submit with both fields empty', async () => {
      await loginPage.login(loginData.emptyUser.username, loginData.emptyUser.password);
    });
    await allure.step('Verify blocked', async () => {
      await expect(page).toHaveURL(/Login/);
      expect(await loginPage.getErrorMessage()).toContain('mandatory');
    });
  });

  // ── Security Tests ────────────────────────────────────────────────────
  test('TC-LOGIN-009 | SQL injection rejected @security', async ({ page }) => {
    await allure.label('suite', 'Security');
    await allure.label('severity', 'critical');
    await allure.step('Enter SQL injection as username', async () => {
      await loginPage.login(loginData.boundaryData.sqlInjection, loginData.validUser.password);
    });
    await allure.step('Verify login rejected, no crash', async () => {
      await expect(page).toHaveURL(/Login/);
      const body = await page.evaluate(() => document.body.innerText.toLowerCase());
      expect(body).not.toContain('exception');
      expect(body).not.toContain('server error');
    });
  });

  test('TC-LOGIN-010 | XSS payload rejected @security', async ({ page }) => {
    await allure.label('suite', 'Security');
    await allure.label('severity', 'critical');
    await allure.step('Enter XSS payload as username', async () => {
      await loginPage.login(loginData.boundaryData.xssPayload, loginData.validUser.password);
    });
    await allure.step('Verify rejected, no script executed', async () => {
      await expect(page).toHaveURL(/Login/);
    });
  });

  // ── Boundary Tests ────────────────────────────────────────────────────
  test('TC-LOGIN-011 | Max length username handled gracefully @regression', async ({ page }) => {
    await allure.label('suite', 'Boundary');
    await allure.label('severity', 'medium');
    await allure.step('Enter 256-character username', async () => {
      await loginPage.login(loginData.boundaryData.longUsername, loginData.validUser.password);
    });
    await allure.step('Verify page does not crash', async () => {
      expect(await loginPage.getPageTitle()).toBeTruthy();
      await expect(page).toHaveURL(/Login/);
    });
  });

  test('TC-LOGIN-012 | Password field masks input @smoke @ui', async ({ page }) => {
    await allure.label('suite', 'UI');
    await allure.label('severity', 'high');
    await allure.step('Verify password input type is password', async () => {
      const type = await loginPage.getPasswordInputType();
      expect(type).toBe('password');
    });
  });

});
