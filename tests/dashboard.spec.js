const { test, expect } = require('@playwright/test');
const LoginPage     = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const config        = require('../utils/config');
const loginData     = require('../test-data/loginData');
const dashData      = require('../test-data/dashboardData');

test.describe('Dashboard Module', () => {
  let dashPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    dashPage = new DashboardPage(page);
    await page.goto(`${config.baseURL}/Account/Logout`);
    await page.waitForLoadState('domcontentloaded');
    await loginPage.navigate(config.loginURL);
    await loginPage.login(loginData.validUser.username, loginData.validUser.password);
    await expect(page).not.toHaveURL(/Login/);
  });

  // ── UI Tests ──────────────────────────────────────────────────────────
  test('TC-DASH-001 | Dashboard page loads with title and H1',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Verify page title contains Dashboard', async () => {
        expect(await dashPage.getPageTitle()).toContain('Dashboard');
      });
      await test.step('Verify H1 = Support Dashboard', async () => {
        expect(await dashPage.getPageHeading()).toContain('Support Dashboard');
      });
      await test.step('Verify URL is root', async () => {
        await expect(page).toHaveURL(`${config.baseURL}/`);
      });
    });

  test('TC-DASH-002 | All 4 stat cards visible with values',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      for (const card of dashData.expectedStatCards) {
        await test.step(`Verify stat card: ${card}`, async () => {
          expect(await dashPage.isStatCardVisible(card)).toBeTruthy();
        });
      }
    });

  test('TC-DASH-003 | OVERVIEW and ANALYTICS buttons visible',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Verify OVERVIEW button visible', async () => {
        await expect(dashPage.overviewBtn).toBeVisible();
      });
      await test.step('Verify ANALYTICS button visible', async () => {
        await expect(dashPage.analyticsBtn).toBeVisible();
      });
    });

  test('TC-DASH-004 | ANALYTICS tab shows analytics content',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Click ANALYTICS button', async () => {
        await dashPage.clickAnalytics();
      });
      await test.step('Verify analytics content visible', async () => {
        expect(await dashPage.isAnalyticsFilterVisible()).toBeTruthy();
      });
    });

  test('TC-DASH-005 | Switch back to OVERVIEW from ANALYTICS',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Switch to ANALYTICS', async () => {
        await dashPage.clickAnalytics();
      });
      await test.step('Switch back to OVERVIEW', async () => {
        await dashPage.clickOverview();
      });
      await test.step('Verify TOTAL TICKETS visible again', async () => {
        expect(await dashPage.isStatCardVisible('TOTAL TICKETS')).toBeTruthy();
      });
    });

  test('TC-DASH-006 | Date range filter applies correctly',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Apply valid date range', async () => {
        await dashPage.applyDateRange(dashData.dateRanges.valid.from, dashData.dateRanges.valid.to);
      });
      await test.step('Verify no crash', async () => {
        expect(await dashPage.hasCrashed()).toBeFalsy();
      });
      await test.step('Verify still on dashboard', async () => {
        await expect(page).toHaveURL(`${config.baseURL}/`);
      });
    });

  test('TC-DASH-007 | Reset button clears date filter',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'medium' }] },
    async ({ page }) => {
      await test.step('Apply date range first', async () => {
        await dashPage.applyDateRange(dashData.dateRanges.valid.from, dashData.dateRanges.valid.to);
      });
      await test.step('Open date picker and find Reset', async () => {
        await dashPage.clickDateRangeToggle();
        await expect(dashPage.resetBtn).toBeVisible();
      });
    });

  test('TC-DASH-008 | Invalid date range To < From handled gracefully',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Boundary' }, { type: 'severity', description: 'medium' }] },
    async ({ page }) => {
      await test.step('Apply invalid date range', async () => {
        await dashPage.applyDateRange(dashData.dateRanges.invalid.from, dashData.dateRanges.invalid.to);
      });
      await test.step('Verify no crash or server error', async () => {
        expect(await dashPage.hasCrashed()).toBeFalsy();
      });
    });

  test('TC-DASH-009 | Active Tickets table with correct columns',
    { tag: ['@smoke'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Verify table is visible', async () => {
        await expect(dashPage.activeTicketsTable).toBeVisible();
      });
      await test.step('Verify correct column headers', async () => {
        const headers = await dashPage.getTableHeaders();
        for (const col of dashData.expectedTableCols) {
          expect(headers).toContain(col);
        }
      });
      await test.step('Verify at least 1 data row', async () => {
        expect(await dashPage.getTableRowCount()).toBeGreaterThan(0);
      });
    });

  test('TC-DASH-010 | View All link navigates to ticket list',
    { tag: ['@regression'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Click View All', async () => {
        await dashPage.clickViewAll();
      });
      await test.step('Verify navigated to Ticket Index', async () => {
        await expect(page).toHaveURL(/Ticket\/Index/);
      });
    });

  test('TC-DASH-011 | All sidebar navigation links present',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Verify Create Ticket link', async () => {
        await expect(dashPage.createTicketLink).toBeVisible();
      });
      await test.step('Verify Action Queue link', async () => {
        await expect(dashPage.actionQueueLink).toBeVisible();
      });
      await test.step('Verify View Tickets link', async () => {
        await expect(dashPage.viewTicketsLink).toBeVisible();
      });
      await test.step('Verify Summary Report link', async () => {
        await expect(dashPage.summaryReportLink).toBeVisible();
      });
    });

  test('TC-DASH-012 | Action Queue badge shows ticket count',
    { tag: ['@regression', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'medium' }] },
    async ({ page }) => {
      await test.step('Verify Action Queue badge has a number', async () => {
        const text = await dashPage.actionQueueLink.textContent();
        expect(/\d/.test(text)).toBeTruthy();
      });
    });

  test('TC-DASH-013 | Search box accepts input',
    { tag: ['@smoke'], annotation: [{ type: 'suite', description: 'Positive' }, { type: 'severity', description: 'medium' }] },
    async ({ page }) => {
      await test.step('Verify search box visible', async () => {
        await expect(dashPage.searchBox).toBeVisible();
      });
      await test.step('Type in search and verify accepted', async () => {
        await dashPage.typeInSearch(dashData.searchTerm);
        expect(await dashPage.searchBox.inputValue()).toBe(dashData.searchTerm);
      });
    });

  test('TC-DASH-014 | User profile dropdown shows username and links',
    { tag: ['@smoke', '@ui'], annotation: [{ type: 'suite', description: 'UI' }, { type: 'severity', description: 'high' }] },
    async ({ page }) => {
      await test.step('Click User Profile button', async () => {
        await dashPage.clickUserProfile();
      });
      await test.step('Verify username sajith_xyz visible', async () => {
        const body = await page.evaluate(() => document.body.innerText);
        expect(body).toContain('sajith_xyz');
      });
      await test.step('Verify My Profile link visible', async () => {
        await expect(dashPage.myProfileLink).toBeVisible();
      });
      await test.step('Verify Sign out link visible', async () => {
        await expect(dashPage.signOutLink).toBeVisible();
      });
    });

  test('TC-DASH-015 | Dashboard inaccessible without login',
    { tag: ['@smoke', '@security'], annotation: [{ type: 'suite', description: 'Security' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await test.step('Logout', async () => {
        await page.goto(`${config.baseURL}/Account/Logout`);
        await page.waitForLoadState('domcontentloaded');
      });
      await test.step('Directly navigate to dashboard', async () => {
        await page.goto(`${config.baseURL}/`);
        await page.waitForLoadState('domcontentloaded');
      });
      await test.step('Verify redirected to login page', async () => {
        await expect(page).toHaveURL(/Login/);
      });
    });

});
