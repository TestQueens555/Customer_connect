const { test, expect } = require('@playwright/test');
const { allure }       = require('allure-playwright');
const LoginPage        = require('../pages/LoginPage');
const DashboardPage    = require('../pages/DashboardPage');
const config           = require('../utils/config');
const loginData        = require('../test-data/loginData');

test.describe('Login Module — E2E Tests', () => {

  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage     = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.navigate(config.loginURL);
  });

  // ── UI Tests ─────────────────────────────────────────────────────────

  test('TC-LOGIN-001 | Login page loads successfully @smoke', async ({ page }) => {
    allure.label('suite', 'Login - UI');
    allure.label('severity', 'critical');
    await allure.step('Verify URL contains Login', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    await allure.step('Verify username field visible', async () => {
      expect(await loginPage.isUsernameFieldVisible()).toBeTruthy();
    });
    await allure.step('Verify password field visible', async () => {
      expect(await loginPage.isPasswordFieldVisible()).toBeTruthy();
    });
    await allure.step('Verify login button is enabled', async () => {
      expect(await loginPage.isLoginButtonEnabled()).toBeTruthy();
    });
    console.log('✅ TC-LOGIN-001 PASSED');
  });

  // ── Positive Tests ────────────────────────────────────────────────────

  test('TC-LOGIN-002 | Valid credentials redirect to dashboard @smoke @critical', async ({ page }) => {
    allure.label('suite', 'Login - Positive');
    allure.label('severity', 'critical');
    await allure.step('Enter valid username', async () => {
      await loginPage.enterUsername(loginData.validUser.username);
    });
    await allure.step('Enter valid password', async () => {
      await loginPage.enterPassword(loginData.validUser.password);
    });
    await allure.step('Click login button', async () => {
      await loginPage.clickLoginButton();
    });
    await allure.step('Verify redirect away from login', async () => {
      await expect(page).not.toHaveURL(/Login/);
    });
    console.log(`✅ TC-LOGIN-002 PASSED — Redirected to: ${page.url()}`);
  });

  test('TC-LOGIN-003 | Login page title is not empty @smoke', async ({ page }) => {
    allure.label('suite', 'Login - UI');
    allure.label('severity', 'normal');
    await allure.step('Verify page has a title', async () => {
      const title = await loginPage.getPageTitle();
      expect(title.length).toBeGreaterThan(0);
    });
    console.log('✅ TC-LOGIN-003 PASSED');
  });

  // ── Negative Tests ────────────────────────────────────────────────────

  test('TC-LOGIN-004 | Invalid credentials shows error @regression @negative', async ({ page }) => {
    allure.label('suite', 'Login - Negative');
    allure.label('severity', 'high');
    await allure.step('Login with invalid credentials', async () => {
      await loginPage.login(loginData.invalidUser.username, loginData.invalidUser.password);
    });
    await allure.step('Verify still on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    await allure.step('Verify error message shown', async () => {
      expect(await loginPage.isErrorVisible()).toBeTruthy();
    });
    console.log('✅ TC-LOGIN-004 PASSED');
  });

  test('TC-LOGIN-005 | Empty credentials blocked @regression @negative', async ({ page }) => {
    allure.label('suite', 'Login - Negative');
    allure.label('severity', 'high');
    await allure.step('Submit empty credentials', async () => {
      await loginPage.login(loginData.emptyUser.username, loginData.emptyUser.password);
    });
    await allure.step('Verify still on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    console.log('✅ TC-LOGIN-005 PASSED');
  });

  test('TC-LOGIN-006 | Valid username empty password blocked @regression @negative', async ({ page }) => {
    allure.label('suite', 'Login - Negative');
    allure.label('severity', 'high');
    await allure.step('Login with only username', async () => {
      await loginPage.login(loginData.validUser.username, loginData.emptyUser.password);
    });
    await allure.step('Verify still on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    console.log('✅ TC-LOGIN-006 PASSED');
  });

  // ── Security Tests ────────────────────────────────────────────────────

  test('TC-LOGIN-007 | SQL injection rejected @security', async ({ page }) => {
    allure.label('suite', 'Login - Security');
    allure.label('severity', 'critical');
    await allure.step('Enter SQL injection payload', async () => {
      await loginPage.login(loginData.boundaryData.sqlInjection, loginData.validUser.password);
    });
    await allure.step('Verify login rejected', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    console.log('✅ TC-LOGIN-007 PASSED');
  });

  test('TC-LOGIN-008 | XSS payload rejected @security', async ({ page }) => {
    allure.label('suite', 'Login - Security');
    allure.label('severity', 'critical');
    await allure.step('Enter XSS payload', async () => {
      await loginPage.login(loginData.boundaryData.xssPayload, loginData.validUser.password);
    });
    await allure.step('Verify page not compromised', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    console.log('✅ TC-LOGIN-008 PASSED');
  });

  // ── Boundary Tests ────────────────────────────────────────────────────

  test('TC-LOGIN-009 | Max length username handled @regression', async ({ page }) => {
    allure.label('suite', 'Login - Boundary');
    allure.label('severity', 'normal');
    await allure.step('Enter 256-char username', async () => {
      await loginPage.login(loginData.boundaryData.longUsername, loginData.validUser.password);
    });
    await allure.step('Verify page is still responsive', async () => {
      const title = await loginPage.getPageTitle();
      expect(title.length).toBeGreaterThan(0);
    });
    console.log('✅ TC-LOGIN-009 PASSED');
  });

  test('TC-LOGIN-010 | Whitespace-only credentials blocked @regression', async ({ page }) => {
    allure.label('suite', 'Login - Boundary');
    allure.label('severity', 'normal');
    await allure.step('Enter whitespace credentials', async () => {
      await loginPage.login(loginData.boundaryData.whitespaceOnly, loginData.boundaryData.whitespaceOnly);
    });
    await allure.step('Verify still on login page', async () => {
      await expect(page).toHaveURL(/Login/);
    });
    console.log('✅ TC-LOGIN-010 PASSED');
  });

});
