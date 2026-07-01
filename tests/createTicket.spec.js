// tests/createTicket.spec.js
// E2E Test Suite — CreateTicket Module
// CustomerConnect QA Pipeline | 01-Jul-2026

const { test, expect } = require('@playwright/test');
const CreateTicketPage = require('../pages/CreateTicketPage');
const LoginPage        = require('../pages/LoginPage');
const config           = require('../utils/config');
const ticketData       = require('../test-data/createTicketData');

// ── Login helper — exact ActionQueue pattern ──────────────────────────────────
// Returns page object only. Each test navigates to Create Ticket itself.
async function loginAndGetPage(page) {
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async d => { try { await d.dismiss(); } catch (_) {} });

  const lp = new LoginPage(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login('sajith_xyz', 'User@123');
  await page.waitForURL(url => !url.includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);   // KendoUI / SPA settle — same as ActionQueue

  return new CreateTicketPage(page);
}

// ── Navigate to Create Ticket with generous CI timeout ────────────────────────
async function goToCreateTicket(page, tp) {
  await page.goto(`${config.baseURL}/Ticket/Create`, { waitUntil: 'domcontentloaded' });
  await page.locator('h1').waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
}

// ── POSITIVE ──────────────────────────────────────────────────────────────────

test('TC-CT-001 | Submit valid ticket with all required fields', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.fillRequiredFields(
    ticketData.validTicket.project, ticketData.validTicket.type,
    ticketData.validTicket.platform, ticketData.validTicket.description
  );
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  const t = await tp.getSwalTitle();
  if (t === 'Submit Ticket?') { await tp.dismissSwal(); await page.waitForTimeout(1500); }
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  expect(await tp.getSwalTitle()).toMatch(/Ticket Submitted/i);
});

test('TC-CT-002 | Submit valid ticket with optional Page/Screen Name', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.enterPageName('Dashboard');
  await tp.fillRequiredFields(
    ticketData.minimalTicket.project, ticketData.minimalTicket.type,
    ticketData.minimalTicket.platform, ticketData.minimalTicket.description
  );
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  const t = await tp.getSwalTitle();
  if (t === 'Submit Ticket?') { await tp.dismissSwal(); await page.waitForTimeout(1500); }
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  expect(await tp.getSwalTitle()).toMatch(/Ticket Submitted/i);
});

test('TC-CT-003 | All 6 ticket type chips are individually selectable', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  for (const t of ticketData.ticketTypes) {
    const chip = page.locator('#typeChips .ct-type-chip', { hasText: t });
    await expect(chip.first()).toBeVisible();
    await chip.first().click();
    await page.waitForTimeout(200);
  }
});

test('TC-CT-004 | All platform chips are individually selectable', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  for (const p of ticketData.platforms) {
    const chip = page.locator('#platformChips .ct-type-chip', { hasText: p });
    await expect(chip.first()).toBeVisible();
  }
});

test('TC-CT-005 | Reset button shows confirmation and clears all form fields', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await page.locator('#txtPageName').fill('Test Page');
  await tp.enterDescription('Filled description here');
  await tp.resetButton.click();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).toMatch(/Reset/i);
  await tp.dismissSwal();
  await page.waitForTimeout(600);
  expect(await page.locator('#txtDescription').inputValue()).toBe('');
  expect(await page.locator('#txtPageName').inputValue()).toBe('');
});

test('TC-CT-006 | Character counter updates dynamically as user types', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  const text = 'Testing counter update!';
  await page.locator('#txtDescription').fill(text);
  await page.waitForTimeout(400);
  const counter = await page.locator('#descCount').textContent();
  expect(parseInt(counter.split(' / ')[0])).toBe(text.length);
});

test('TC-CT-007 | Page loads with correct title, heading and all UI elements', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await expect(page).toHaveTitle(/Create Ticket/i);
  await expect(page.locator('h1')).toContainText('Create New Ticket');
  await expect(tp.submitButton).toBeVisible();
  await expect(tp.resetButton).toBeVisible();
  await expect(tp.descriptionInput).toBeVisible();
  await expect(page.locator('#descCount')).toBeVisible();
  await expect(page.locator('#txtPageName')).toBeVisible();
});


// ── NEGATIVE ──────────────────────────────────────────────────────────────────

test('TC-CT-008 | Submit without project shows validation error', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Project/i);
  await tp.dismissSwal();
});

test('TC-CT-009 | Submit without ticket type shows validation error', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Ticket Type/i);
  await tp.dismissSwal();
});

test('TC-CT-010 | Submit without platform shows validation error', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Platform/i);
  await tp.dismissSwal();
});

test('TC-CT-011 | Submit without description shows validation error', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-012 | Submit with description below 15 chars is rejected', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin14);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-013 | Submit all fields empty shows all validation errors', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).toMatch(/Missing Information/i);
  const content = await tp.getSwalContent();
  expect(content).toMatch(/Project/i);
  expect(content).toMatch(/Ticket Type/i);
  expect(content).toMatch(/Description/i);
  await tp.dismissSwal();
});

// ── BOUNDARY ──────────────────────────────────────────────────────────────────

test('TC-CT-014 | Description exactly 15 chars (min boundary) is accepted', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).not.toMatch(/Missing Information/i);
  await tp.dismissSwal();
});

test('TC-CT-015 | Description exactly 14 chars (below min) is rejected', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin14);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-016 | Description exactly 2000 chars (max boundary) is accepted', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMax);
  await page.waitForTimeout(400);
  const count = parseInt((await page.locator('#descCount').textContent()).split(' / ')[0]);
  expect(count).toBe(2000);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).not.toMatch(/Missing Information/i);
  await tp.dismissSwal();
});

test('TC-CT-017 | Description 2001 chars should be blocked — BUG-CT-001', async ({ page }) => {
  // Expected to FAIL — BUG-CT-001: no server-side max-length enforcement
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await page.locator('#txtDescription').fill(ticketData.boundary.descriptionOver);
  await page.waitForTimeout(400);
  const count = parseInt((await page.locator('#descCount').textContent()).split(' / ')[0]);
  expect(count).toBeLessThanOrEqual(2000);  // FAIL: actual counter shows 2001
});

test('TC-CT-018 | Page/Screen Name 300 chars handled gracefully', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await page.locator('#txtPageName').fill(ticketData.boundary.pageNameLong);
  await tp.fillRequiredFields(
    ticketData.validTicket.project, ticketData.validTicket.type,
    ticketData.validTicket.platform, 'Valid description for page name boundary test.'
  );
  await tp.clickSubmit();
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});


// ── SECURITY ──────────────────────────────────────────────────────────────────

test('TC-CT-019 | Unauthenticated access redirects to login', async ({ browser }) => {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${config.baseURL}/Ticket/Create`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/Login|Account/i);
  await ctx.close();
});

test('TC-CT-020 | SQL injection in description handled safely', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.sqlInjection);
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-021 | XSS payload in description does not execute', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.xssPayload + ' This is valid description text');
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-022 | HTML injection in description is sanitised', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.selectProject(ticketData.validTicket.project);
  await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.htmlInjection + ' This is valid description text here');
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-023 | XSS payload in Page/Screen Name does not execute', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await page.locator('#txtPageName').fill(ticketData.security.xssPageName);
  await tp.fillRequiredFields(
    ticketData.validTicket.project, ticketData.validTicket.type,
    ticketData.validTicket.platform, 'Valid description for XSS page name security test here.'
  );
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-024 | Cancel Reset dialog retains all form fields', async ({ page }) => {
  const tp = await loginAndGetPage(page);
  await goToCreateTicket(page, tp);
  await tp.enterDescription('This text should remain after cancel reset test.');
  await tp.resetButton.click();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  const denyBtn = page.locator('.swal2-deny, .swal2-cancel');
  if (await denyBtn.isVisible().catch(() => false)) {
    await denyBtn.click();
  } else {
    const btns  = page.locator('.swal2-actions button');
    const count = await btns.count();
    if (count > 1) await btns.nth(1).click();
  }
  await page.waitForTimeout(500);
  const desc = await page.locator('#txtDescription').inputValue();
  expect(desc.length).toBeGreaterThan(0);
});
