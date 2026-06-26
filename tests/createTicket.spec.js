const { test, expect } = require('@playwright/test');
const LoginPage        = require('../pages/LoginPage');
const CreateTicketPage = require('../pages/CreateTicketPage');
const config           = require('../utils/config');
const loginData        = require('../test-data/loginData');
const ticketData       = require('../test-data/createTicketData');

// Auth session is set globally in playwright.config.js via storageState
// global-setup.js logs in once and saves the session before all tests run

test.describe('Create Ticket Module — E2E Tests', () => {

  let tp;

  test.beforeEach(async ({ page }) => {
    tp = new CreateTicketPage(page);
    await tp.navigateToCreateTicket();
  });

  // ══════════════ POSITIVE ═══════════════════════════════════════════════════

  test('TC-TICKET-001 | Create Ticket page loads with all required fields', async ({ page }) => {
    await expect(page).toHaveTitle(/Create Ticket/i);
    await expect(tp.projectInput).toBeVisible();
    await expect(page.locator('input[placeholder="Select Type..."]')).toBeVisible();
    await expect(tp.descriptionInput).toBeVisible();
    await expect(tp.submitButton).toBeVisible();
    await expect(tp.resetButton).toBeVisible();
    await expect(tp.browseFilesBtn).toBeVisible();
    console.log('✅ TC-TICKET-001 PASSED');
  });

  test('TC-TICKET-002 | Project dropdown shows all available projects', async ({ page }) => {
    await tp.projectInput.click();
    await page.waitForTimeout(800);
    const options = await page.locator('.dx-list-item').allTextContents();
    const filtered = options.map(o => o.trim()).filter(Boolean);
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    console.log(`✅ TC-TICKET-002 PASSED — ${filtered.length} projects: ${filtered.join(', ')}`);
  });

  test('TC-TICKET-003 | All 6 Ticket Type chips are visible', async ({ page }) => {
    for (const t of ticketData.ticketTypes) {
      const chip = page.locator('#typeChips .ct-type-chip', { hasText: t });
      await expect(chip.first()).toBeVisible();
    }
    console.log('✅ TC-TICKET-003 PASSED');
  });

  test('TC-TICKET-004 | All 6 platform chips visible on page load', async ({ page }) => {
    for (const p of ticketData.platforms) {
      const chip = page.locator('#platformChips .ct-type-chip', { hasText: p });
      await expect(chip.first()).toBeVisible();
    }
    console.log('✅ TC-TICKET-004 PASSED');
  });

  test('TC-TICKET-005 | Description character counter updates on input', async ({ page }) => {
    const sampleText = 'Testing character counter update';
    await page.locator('#txtDescription').fill(sampleText);
    await page.waitForTimeout(400);
    const charCount = await page.locator('#descCount').textContent();
    const count = parseInt(charCount.split(' / ')[0]);
    expect(count).toBe(sampleText.length);
    console.log(`✅ TC-TICKET-005 PASSED — Counter: ${charCount.trim()}`);
  });

  test('TC-TICKET-006 | File attachment — PNG upload accepted', async ({ page }) => {
    await tp.uploadFile(ticketData.fileUpload.validImageFile);
    const fileName = await tp.getUploadedFileName();
    expect(fileName.length).toBeGreaterThan(0);
    expect(fileName).toContain('Screenshot');
    console.log(`✅ TC-TICKET-006 PASSED — File: ${fileName}`);
  });

  test('TC-TICKET-007 | Reset button clears all filled fields', async ({ page }) => {
    await page.locator('#txtPageName').fill('TestPageName');
    await page.locator('#txtDescription').fill('Some description text here okay');
    await tp.clickReset();
    const descVal = await page.locator('#txtDescription').inputValue();
    const pageVal = await page.locator('#txtPageName').inputValue();
    expect(descVal.trim()).toBe('');
    expect(pageVal.trim()).toBe('');
    console.log('✅ TC-TICKET-007 PASSED');
  });

  // ══════════════ NEGATIVE ═══════════════════════════════════════════════════

  test('TC-TICKET-008 | Submit with no fields filled shows Missing Information', async ({ page }) => {
    await tp.clickSubmit();
    await expect(tp.swalPopup).toBeVisible();
    const title = await tp.getSwalTitle();
    expect(title).toMatch(/Missing Information/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-008 PASSED');
  });

  test('TC-TICKET-009 | Submit without Project shows validation error', async ({ page }) => {
    await page.locator('#typeChips .ct-type-chip').first().click();
    await page.waitForTimeout(400);
    await tp.enterDescription('This is a valid description over fifteen chars');
    await tp.clickSubmit();
    await expect(tp.swalPopup).toBeVisible();
    expect(await tp.getSwalTitle()).toMatch(/Missing Information/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-009 PASSED');
  });

  test('TC-TICKET-010 | Submit without Ticket Type shows validation error', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.enterDescription('This is a valid description over fifteen chars');
    await tp.clickSubmit();
    await expect(tp.swalPopup).toBeVisible();
    expect(await tp.getSwalContent()).toMatch(/Ticket Type/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-010 PASSED');
  });

  test('TC-TICKET-011 | Submit without Description shows validation error', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.clickSubmit();
    await expect(tp.swalPopup).toBeVisible();
    expect(await tp.getSwalContent()).toMatch(/Description/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-011 PASSED');
  });

  test('TC-TICKET-012 | Submit with description under 15 chars blocked', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMin14);
    await tp.clickSubmit();
    await expect(tp.swalPopup).toBeVisible();
    expect(await tp.getSwalContent()).toMatch(/Description/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-012 PASSED');
  });

  test('TC-TICKET-013 | Page/Screen Name field is optional', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.enterDescription('Valid description text over 15 chars for optional test');
    await tp.clickSubmit();
    const content = await tp.getSwalContent().catch(() => '');
    expect(content.toLowerCase()).not.toMatch(/page.*screen name/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-013 PASSED');
  });

  // ══════════════ BOUNDARY ═══════════════════════════════════════════════════

  test('TC-TICKET-014 | Description with exactly 15 chars passes validation', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.enterDescription(ticketData.boundary.descriptionMin);
    await tp.clickSubmit();
    expect(await tp.getSwalTitle()).not.toMatch(/Missing Information/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-014 PASSED');
  });

  test('TC-TICKET-015 | Description at 2000 chars accepted by counter', async ({ page }) => {
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMax);
    await page.waitForTimeout(400);
    const count = parseInt((await page.locator('#descCount').textContent()).split(' / ')[0]);
    expect(count).toBe(2000);
    console.log(`✅ TC-TICKET-015 PASSED`);
  });

  test('TC-TICKET-016 | Description over 2000 chars truncated to max', async ({ page }) => {
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionOver);
    await page.waitForTimeout(400);
    const count = parseInt((await page.locator('#descCount').textContent()).split(' / ')[0]);
    expect(count).toBeLessThanOrEqual(2000);
    console.log(`✅ TC-TICKET-016 PASSED — truncated to ${count}`);
  });

  test('TC-TICKET-017 | Long page name (300 chars) handled gracefully', async ({ page }) => {
    await page.locator('#txtPageName').fill(ticketData.boundary.pageNameLong);
    await page.waitForTimeout(400);
    const val = await page.locator('#txtPageName').inputValue();
    expect(val.length).toBeGreaterThan(0);
    await expect(page).not.toHaveTitle(/500|error/i);
    console.log(`✅ TC-TICKET-017 PASSED`);
  });

  test('TC-TICKET-018 | Special characters in description handled safely', async ({ page }) => {
    await page.locator('#txtDescription').fill(ticketData.boundary.descriptionSpecial);
    await page.waitForTimeout(400);
    const count = parseInt((await page.locator('#descCount').textContent()).split(' / ')[0]);
    expect(count).toBe(ticketData.boundary.descriptionSpecial.length);
    console.log(`✅ TC-TICKET-018 PASSED`);
  });

  // ══════════════ SECURITY ═══════════════════════════════════════════════════

  test('TC-TICKET-019 | SQL injection in description handled safely', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.enterDescription(ticketData.security.sqlInjection);
    await tp.clickSubmit();
    await expect(page).not.toHaveTitle(/500|error/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-019 PASSED');
  });

  test('TC-TICKET-020 | XSS payload in description handled safely', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.enterDescription(ticketData.security.xssPayload + ' This is a valid description text');
    await tp.clickSubmit();
    await expect(page).not.toHaveTitle(/500|error/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-020 PASSED');
  });

  test('TC-TICKET-021 | Unauthenticated access redirected to login', async ({ browser }) => {
    // Fresh context — no stored session
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${config.baseURL}/Ticket/Create`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/Login|Account/i);
    await ctx.close();
    console.log('✅ TC-TICKET-021 PASSED');
  });

  test('TC-TICKET-022 | HTML injection in description handled safely', async ({ page }) => {
    await tp.selectProject(ticketData.validTicket.project);
    await tp.clickTypeChip(ticketData.validTicket.type);
    await tp.clickPlatformChip(ticketData.validTicket.platform);
    await tp.enterDescription(ticketData.security.htmlInjection + ' This is a valid description text here');
    await tp.clickSubmit();
    await expect(page).not.toHaveTitle(/500|error/i);
    await tp.dismissSwal();
    console.log('✅ TC-TICKET-022 PASSED');
  });

});
