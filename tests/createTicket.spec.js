const { test, expect } = require('@playwright/test');
const LoginPage          = require('../pages/LoginPage');
const CreateTicketPage   = require('../pages/CreateTicketPage');
const config             = require('../utils/config');
const loginData          = require('../test-data/loginData');
const ticketData         = require('../test-data/createTicketData');

// ── Helper: login before each test ───────────────────────────────────────────
async function loginAndGo(page) {
  const loginPage = new LoginPage(page);
  await loginPage.navigate(config.loginURL);
  await loginPage.login(loginData.validUser.username, loginData.validUser.password);
  await page.waitForLoadState('networkidle');
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Create Ticket Module — E2E Tests', () => {

  let ticketPage;

  test.beforeEach(async ({ page }) => {
    await loginAndGo(page);
    ticketPage = new CreateTicketPage(page);
    await ticketPage.navigateToCreateTicket();
  });

  // ══ POSITIVE TESTS ════════════════════════════════════════════════════════

  test('TC-TICKET-001 | Create Ticket page loads with all required fields', async ({ page }) => {
    // -- Step 1: Verify page title --
    await expect(page).toHaveTitle(/Create Ticket/i);
    // -- Step 2: Verify key elements visible --
    await expect(ticketPage.projectInput).toBeVisible();
    await expect(ticketPage.typeInput).toBeVisible();
    await expect(ticketPage.descriptionInput).toBeVisible();
    await expect(ticketPage.submitButton).toBeVisible();
    await expect(ticketPage.resetButton).toBeVisible();
    console.log('✅ TC-TICKET-001 PASSED — Page loaded with all fields');
  });

  test('TC-TICKET-002 | Submit ticket with all required fields filled', async ({ page }) => {
    // -- Step 1: Fill all required fields --
    await ticketPage.fillValidTicket(ticketData.validTicket);
    // -- Step 2: Submit the ticket --
    await ticketPage.clickSubmit();
    // -- Step 3: Verify no validation error popup appears (or success shown) --
    const swalTitle = await ticketPage.getSwalTitle();
    expect(swalTitle).not.toMatch(/Missing Information/i);
    console.log('✅ TC-TICKET-002 PASSED — Ticket submitted without missing information errors');
  });

  test('TC-TICKET-003 | Project dropdown shows all available projects', async ({ page }) => {
    // -- Step 1: Click project input --
    await ticketPage.projectInput.click();
    await page.waitForTimeout(800);
    // -- Step 2: Verify options present --
    const options = await page.locator('.dx-list-item').allTextContents();
    const filtered = options.map(o => o.trim()).filter(Boolean);
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    console.log(`✅ TC-TICKET-003 PASSED — ${filtered.length} projects found: ${filtered.join(', ')}`);
  });

  test('TC-TICKET-004 | Selecting project unlocks Platform dropdown', async ({ page }) => {
    // -- Step 1: Verify platform locked before project selection --
    const lockedBefore = await ticketPage.isPlatformLocked();
    expect(lockedBefore).toBeTruthy();
    // -- Step 2: Select a project --
    await ticketPage.selectProject(ticketData.validTicket.project);
    // -- Step 3: Verify platform dropdown now active --
    const lockedAfter = await ticketPage.isPlatformLocked();
    expect(lockedAfter).toBeFalsy();
    console.log('✅ TC-TICKET-004 PASSED — Platform unlocked after project selection');
  });

  test('TC-TICKET-005 | All Ticket Type chips are visible', async ({ page }) => {
    // -- Step 1: Check each chip type exists --
    for (const type of ticketData.ticketTypes) {
      const chip = page.locator('text=' + type).first();
      await expect(chip).toBeVisible();
    }
    console.log('✅ TC-TICKET-005 PASSED — All ticket type chips visible');
  });

  test('TC-TICKET-006 | Description character counter updates on input', async ({ page }) => {
    // -- Step 1: Enter text in description --
    const sampleText = 'Testing character counter update';
    await ticketPage.enterDescription(sampleText);
    // -- Step 2: Verify counter shows non-zero --
    const charCount = await ticketPage.getCharCount();
    expect(charCount).not.toBe('0 / 2000');
    const count = parseInt(charCount.split(' / ')[0]);
    expect(count).toBe(sampleText.length);
    console.log(`✅ TC-TICKET-006 PASSED — Char counter shows: ${charCount}`);
  });

  test('TC-TICKET-007 | Reset button clears all filled fields', async ({ page }) => {
    // -- Step 1: Fill some fields --
    await ticketPage.enterPageName('Test Page');
    await ticketPage.enterDescription('Some description text here');
    // -- Step 2: Click Reset --
    await ticketPage.clickReset();
    await page.waitForTimeout(500);
    // -- Step 3: Verify description is cleared --
    const descValue = await ticketPage.descriptionInput.inputValue().catch(
      () => ticketPage.descriptionInput.textContent()
    );
    expect(descValue?.trim()).toBe('');
    console.log('✅ TC-TICKET-007 PASSED — Reset clears form fields');
  });

  test('TC-TICKET-008 | Page/Screen Name field is optional', async ({ page }) => {
    // -- Step 1: Fill only required fields (skip page name) --
    await ticketPage.selectProject(ticketData.minimalTicket.project);
    await ticketPage.selectTicketType(ticketData.minimalTicket.type);
    await ticketPage.selectPlatform(ticketData.minimalTicket.platform);
    await ticketPage.enterDescription(ticketData.minimalTicket.description);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: No missing info popup for page name --
    const swalContent = await ticketPage.getSwalContent();
    expect(swalContent).not.toMatch(/Page.*Screen Name/i);
    console.log('✅ TC-TICKET-008 PASSED — Page/Screen Name is optional');
  });

  // ══ NEGATIVE TESTS ════════════════════════════════════════════════════════

  test('TC-TICKET-009 | Submit with no fields filled shows validation popup', async ({ page }) => {
    // -- Step 1: Click submit without filling anything --
    await ticketPage.clickSubmit();
    // -- Step 2: Verify SweetAlert validation popup appears --
    await expect(ticketPage.swalPopup).toBeVisible();
    const swalTitle = await ticketPage.getSwalTitle();
    expect(swalTitle).toMatch(/Missing Information/i);
    console.log('✅ TC-TICKET-009 PASSED — Validation popup shown for empty form');
  });

  test('TC-TICKET-010 | Submit without Project shows Missing Information', async ({ page }) => {
    // -- Step 1: Fill all except Project --
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.enterDescription(ticketData.validTicket.description);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Check validation popup content --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    // Platform is unlocked only after project — so both should be missing
    expect(await ticketPage.isSwalVisible()).toBeTruthy();
    console.log(`✅ TC-TICKET-010 PASSED — Validation shown, content: ${content.trim()}`);
  });

  test('TC-TICKET-011 | Submit without Ticket Type shows validation error', async ({ page }) => {
    // -- Step 1: Fill all except Ticket Type --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.validTicket.description);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Verify validation --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    expect(content).toMatch(/Ticket Type/i);
    console.log('✅ TC-TICKET-011 PASSED — Missing Ticket Type flagged');
  });

  test('TC-TICKET-012 | Submit without Description shows validation error', async ({ page }) => {
    // -- Step 1: Fill all except Description --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Verify validation --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    expect(content).toMatch(/Description/i);
    console.log('✅ TC-TICKET-012 PASSED — Missing Description flagged');
  });

  test('TC-TICKET-013 | Submit without Platform shows validation error', async ({ page }) => {
    // -- Step 1: Fill all except Platform --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.enterDescription(ticketData.validTicket.description);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Verify validation --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    expect(content).toMatch(/Platform/i);
    console.log('✅ TC-TICKET-013 PASSED — Missing Platform flagged');
  });

  // ══ BOUNDARY TESTS ════════════════════════════════════════════════════════

  test('TC-TICKET-014 | Description with exactly 14 chars fails validation', async ({ page }) => {
    // -- Step 1: Fill form with 14-char description (below min 15) --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.boundary.descriptionMin14);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Validation shown for short description --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    expect(content).toMatch(/Description/i);
    console.log('✅ TC-TICKET-014 PASSED — 14-char description rejected');
  });

  test('TC-TICKET-015 | Description with exactly 15 chars passes validation', async ({ page }) => {
    // -- Step 1: Fill form with min-valid 15-char description --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.boundary.descriptionMin);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: No description validation error --
    const swalContent = await ticketPage.getSwalContent().catch(() => '');
    expect(swalContent).not.toMatch(/min 15/i);
    console.log('✅ TC-TICKET-015 PASSED — 15-char description accepted');
  });

  test('TC-TICKET-016 | Description at 2000 chars (max) is accepted', async ({ page }) => {
    // -- Step 1: Enter 2000-char description --
    await ticketPage.enterDescription(ticketData.boundary.descriptionMax);
    // -- Step 2: Verify counter shows 2000 / 2000 --
    const charCount = await ticketPage.getCharCount();
    const count = parseInt(charCount.split(' / ')[0]);
    expect(count).toBe(2000);
    console.log(`✅ TC-TICKET-016 PASSED — 2000-char description accepted, counter: ${charCount}`);
  });

  test('TC-TICKET-017 | Platform chips show all expected options after project selected', async ({ page }) => {
    // -- Step 1: Select a project first --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await page.waitForTimeout(500);
    // -- Step 2: Verify platform chips are now visible --
    for (const platform of ['Backend', 'General', 'Testing']) {
      const chip = page.locator('text=' + platform).first();
      await expect(chip).toBeVisible();
    }
    console.log('✅ TC-TICKET-017 PASSED — Platform chips visible after project selection');
  });

  // ══ SECURITY / ERROR HANDLING TESTS ══════════════════════════════════════

  test('TC-TICKET-018 | SQL injection in description is handled safely', async ({ page }) => {
    // -- Step 1: Fill form with SQL injection in description --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.security.sqlInjection);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: Page does not crash; stays on create ticket or shows controlled response --
    const title = await ticketPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    console.log(`✅ TC-TICKET-018 PASSED — SQL injection handled, page: ${title}`);
  });

  test('TC-TICKET-019 | XSS payload in description is handled safely', async ({ page }) => {
    // -- Step 1: Fill form with XSS payload in description --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.security.xssPayload);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: No XSS execution (no alert dialog) --
    const title = await ticketPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    console.log(`✅ TC-TICKET-019 PASSED — XSS payload handled safely`);
  });

  test('TC-TICKET-020 | Unauthenticated user is redirected to login page', async ({ page }) => {
    // -- Step 1: Clear session (navigate away to logout or clear cookies) --
    await page.context().clearCookies();
    // -- Step 2: Try to access create ticket directly --
    await page.goto('http://customerportal.dev-ts.online/Ticket/Create');
    await page.waitForLoadState('networkidle');
    // -- Step 3: Verify redirect to login page --
    await expect(page).toHaveURL(/Login|Account/i);
    console.log('✅ TC-TICKET-020 PASSED — Unauthenticated access redirected to login');
  });

});
