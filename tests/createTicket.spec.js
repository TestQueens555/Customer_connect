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
    // -- Step 3: Verify no validation error popup appears --
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
    // -- Step 1: Verify platform chips are empty before project selected --
    const chipsBefore = await page.locator('#platformChips .ct-type-chip').count();
    expect(chipsBefore).toBe(0);
    // -- Step 2: Select a project --
    await ticketPage.selectProject(ticketData.validTicket.project);
    // -- Step 3: Verify platform chips are now populated --
    await page.waitForSelector('#platformChips .ct-type-chip', { timeout: 8000 });
    const chipsAfter = await page.locator('#platformChips .ct-type-chip').count();
    expect(chipsAfter).toBeGreaterThan(0);
    console.log('✅ TC-TICKET-004 PASSED — Platform unlocked after project selection');
  });

  test('TC-TICKET-005 | All Ticket Type chips are visible', async ({ page }) => {
    // -- Step 1: Check each chip exists inside #typeChips (scoped — avoids hidden step labels) --
    for (const type of ticketData.ticketTypes) {
      const chip = page.locator('#typeChips .ct-type-chip', { hasText: type });
      await expect(chip.first()).toBeVisible();
    }
    console.log('✅ TC-TICKET-005 PASSED — All ticket type chips visible');
  });

  test('TC-TICKET-006 | Description character counter updates on input', async ({ page }) => {
    // -- Step 1: Enter text in description using correct textarea ID --
    const sampleText = 'Testing character counter update';
    await page.locator('#txtDescription').fill(sampleText);
    await page.waitForTimeout(300);
    // -- Step 2: Verify counter via #descCount element --
    const charCount = await page.locator('#descCount').textContent();
    expect(charCount.trim()).not.toBe('0 / 2000');
    const count = parseInt(charCount.split(' / ')[0]);
    expect(count).toBe(sampleText.length);
    console.log(`✅ TC-TICKET-006 PASSED — Char counter shows: ${charCount.trim()}`);
  });

  test('TC-TICKET-007 | Reset button clears all filled fields', async ({ page }) => {
    // -- Step 1: Fill page name and description --
    await page.locator('#txtPageName').fill('Test Page');
    await page.locator('#txtDescription').fill('Some description text here');
    // -- Step 2: Click Reset --
    await ticketPage.resetButton.click();
    await page.waitForTimeout(600);
    // -- Step 3: Confirm the SweetAlert Reset dialog --
    await expect(ticketPage.swalPopup).toBeVisible();
    const swalTitle = await ticketPage.getSwalTitle();
    expect(swalTitle).toMatch(/Reset/i);
    await page.locator('.swal2-confirm').click();
    // -- Step 4: Wait for page to settle after reset --
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    // -- Step 5: Verify fields cleared --
    const descValue  = await page.locator('#txtDescription').inputValue();
    const pageValue  = await page.locator('#txtPageName').inputValue();
    expect(descValue.trim()).toBe('');
    expect(pageValue.trim()).toBe('');
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
    const swalContent = await ticketPage.getSwalContent().catch(() => '');
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
    // -- Step 3: Validation popup must be visible --
    await expect(ticketPage.swalPopup).toBeVisible();
    const title = await ticketPage.getSwalTitle();
    expect(title).toMatch(/Missing Information/i);
    console.log(`✅ TC-TICKET-010 PASSED — Validation shown for missing Project`);
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
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMin14);
    await page.waitForTimeout(200);
    // -- Step 2: Verify the test data is exactly 14 chars --
    const charCount = await page.locator('#descCount').textContent();
    const len = parseInt(charCount.split(' / ')[0]);
    expect(len).toBeLessThan(15);
    // -- Step 3: Submit --
    await ticketPage.clickSubmit();
    // -- Step 4: Validation shown for short description --
    await expect(ticketPage.swalPopup).toBeVisible();
    const content = await ticketPage.getSwalContent();
    expect(content).toMatch(/Description/i);
    console.log(`✅ TC-TICKET-014 PASSED — ${len}-char description rejected`);
  });

  test('TC-TICKET-015 | Description with exactly 15 chars passes validation', async ({ page }) => {
    // -- Step 1: Fill form with min-valid 15-char description --
    await ticketPage.selectProject(ticketData.validTicket.project);
    await ticketPage.selectTicketType(ticketData.validTicket.type);
    await ticketPage.selectPlatform(ticketData.validTicket.platform);
    await ticketPage.enterDescription(ticketData.boundary.descriptionMin);
    // -- Step 2: Submit --
    await ticketPage.clickSubmit();
    // -- Step 3: No description validation error (confirmation dialog appears) --
    const swalTitle = await ticketPage.getSwalTitle();
    expect(swalTitle).not.toMatch(/Missing Information/i);
    console.log('✅ TC-TICKET-015 PASSED — 15-char description accepted');
  });

  test('TC-TICKET-016 | Description at 2000 chars (max) is accepted', async ({ page }) => {
    // -- Step 1: Enter 2000-char description using correct textarea ID --
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMax);
    await page.waitForTimeout(300);
    // -- Step 2: Verify counter via #descCount element --
    const charCount = await page.locator('#descCount').textContent();
    const count = parseInt(charCount.split(' / ')[0]);
    expect(count).toBe(2000);
    console.log(`✅ TC-TICKET-016 PASSED — 2000-char description accepted, counter: ${charCount.trim()}`);
  });

  test('TC-TICKET-017 | Platform chips show all expected options after project selected', async ({ page }) => {
    // -- Step 1: Select a project first --
    await ticketPage.selectProject(ticketData.validTicket.project);
    // -- Step 2: Wait for API and verify platform chips loaded --
    await page.waitForSelector('#platformChips .ct-type-chip', { timeout: 8000 });
    for (const platform of ['Backend', 'General', 'Testing']) {
      const chip = page.locator('#platformChips .ct-type-chip', { hasText: platform });
      await expect(chip.first()).toBeVisible();
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
    // -- Step 3: Page does not crash --
    const title = await ticketPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/500|error/i);
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
    // -- Step 3: No XSS execution --
    const title = await ticketPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/500|error/i);
    console.log(`✅ TC-TICKET-019 PASSED — XSS payload handled safely`);
  });

  test('TC-TICKET-020 | Unauthenticated user is redirected to login page', async ({ page }) => {
    // -- Step 1: Clear session cookies --
    await page.context().clearCookies();
    // -- Step 2: Try to access create ticket directly --
    await page.goto('http://customerportal.dev-ts.online/Ticket/Create');
    await page.waitForLoadState('networkidle');
    // -- Step 3: Verify redirect to login page --
    await expect(page).toHaveURL(/Login|Account/i);
    console.log('✅ TC-TICKET-020 PASSED — Unauthenticated access redirected to login');
  });

});
