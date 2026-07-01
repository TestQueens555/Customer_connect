// tests/createTicket.spec.js
// E2E Test Suite — CreateTicket Module
// CustomerConnect QA Pipeline | Uses shared loginHelper
'use strict';
const { test, expect } = require('@playwright/test');
const CreateTicketPage = require('../pages/CreateTicketPage');
const { loginAndGoTo, unauthAccess } = require('../utils/loginHelper');
const config      = require('../utils/config');
const ticketData  = require('../test-data/createTicketData');

// One-liner per test — no boilerplate
const login = (page) => loginAndGoTo(page, '/Ticket/Create', CreateTicketPage);

// ── POSITIVE ──────────────────────────────────────────────────────────────────
test('TC-CT-001 | Submit valid ticket with all required fields', async ({ page }) => {
  const tp = await login(page);
  await tp.fillRequiredFields(ticketData.validTicket.project, ticketData.validTicket.type, ticketData.validTicket.platform, ticketData.validTicket.description);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  const t = await tp.getSwalTitle();
  if (t === 'Submit Ticket?') { await tp.dismissSwal(); await page.waitForTimeout(1500); }
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  expect(await tp.getSwalTitle()).toMatch(/Ticket Submitted/i);
});

test('TC-CT-002 | Submit valid ticket with optional Page/Screen Name', async ({ page }) => {
  const tp = await login(page);
  await tp.enterPageName('Dashboard');
  await tp.fillRequiredFields(ticketData.minimalTicket.project, ticketData.minimalTicket.type, ticketData.minimalTicket.platform, ticketData.minimalTicket.description);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 8000 });
  const t = await tp.getSwalTitle();
  if (t === 'Submit Ticket?') { await tp.dismissSwal(); await page.waitForTimeout(1500); }
  expect(await tp.getSwalTitle()).toMatch(/Ticket Submitted/i);
});

test('TC-CT-003 | All 6 ticket type chips are individually selectable', async ({ page }) => {
  const tp = await login(page);
  for (const t of ticketData.ticketTypes) {
    await expect(page.locator('#typeChips .ct-type-chip', { hasText: t }).first()).toBeVisible();
    await page.locator('#typeChips .ct-type-chip', { hasText: t }).first().click();
    await page.waitForTimeout(200);
  }
});

test('TC-CT-004 | All platform chips are individually selectable', async ({ page }) => {
  const tp = await login(page);
  for (const p of ticketData.platforms) {
    await expect(page.locator('#platformChips .ct-type-chip', { hasText: p }).first()).toBeVisible();
  }
});

test('TC-CT-005 | Reset button shows confirmation and clears all form fields', async ({ page }) => {
  const tp = await login(page);
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

test('TC-CT-006 | Character counter updates dynamically', async ({ page }) => {
  const tp = await login(page);
  const text = 'Testing counter update!';
  await page.locator('#txtDescription').fill(text);
  await page.waitForTimeout(400);
  const counter = await page.locator('#descCount').textContent();
  expect(parseInt(counter.split(' / ')[0])).toBe(text.length);
});

test('TC-CT-007 | Page loads with correct title, heading and all UI elements', async ({ page }) => {
  const tp = await login(page);
  await expect(page).toHaveTitle(/Create Ticket/i);
  await expect(page.locator('h1')).toContainText('Create New Ticket');
  await expect(tp.submitButton).toBeVisible();
  await expect(tp.resetButton).toBeVisible();
  await expect(tp.descriptionInput).toBeVisible();
  await expect(page.locator('#descCount')).toBeVisible();
});

// ── NEGATIVE ──────────────────────────────────────────────────────────────────
test('TC-CT-008 | Submit without project shows validation error', async ({ page }) => {
  const tp = await login(page);
  await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Project/i);
  await tp.dismissSwal();
});

test('TC-CT-009 | Submit without ticket type shows validation error', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Ticket Type/i);
  await tp.dismissSwal();
});

test('TC-CT-010 | Submit without platform shows validation error', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type);
  await tp.enterDescription('Valid description over fifteen chars here');
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Platform/i);
  await tp.dismissSwal();
});

test('TC-CT-011 | Submit without description shows validation error', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-012 | Submit with description below 15 chars is rejected', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin14);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-013 | Submit all fields empty shows all validation errors', async ({ page }) => {
  const tp = await login(page);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).toMatch(/Missing Information/i);
  const c = await tp.getSwalContent();
  expect(c).toMatch(/Project/i); expect(c).toMatch(/Ticket Type/i); expect(c).toMatch(/Description/i);
  await tp.dismissSwal();
});

// ── BOUNDARY ──────────────────────────────────────────────────────────────────
test('TC-CT-014 | Description exactly 15 chars (min boundary) is accepted', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).not.toMatch(/Missing Information/i);
  await tp.dismissSwal();
});

test('TC-CT-015 | Description exactly 14 chars (below min) is rejected', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.boundary.descriptionMin14);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalContent()).toMatch(/Description/i);
  await tp.dismissSwal();
});

test('TC-CT-016 | Description exactly 2000 chars (max boundary) is accepted', async ({ page }) => {
  const tp = await login(page);
  await page.locator('#txtDescription').fill(ticketData.boundary.descriptionMax);
  await page.waitForTimeout(400);
  expect(parseInt((await page.locator('#descCount').textContent()).split(' / ')[0])).toBe(2000);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.clickSubmit();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  expect(await tp.getSwalTitle()).not.toMatch(/Missing Information/i);
  await tp.dismissSwal();
});

test('TC-CT-017 | Description 2001 chars should be blocked — BUG-CT-001', async ({ page }) => {
  const tp = await login(page);
  await page.locator('#txtDescription').fill(ticketData.boundary.descriptionOver);
  await page.waitForTimeout(400);
  expect(parseInt((await page.locator('#descCount').textContent()).split(' / ')[0])).toBeLessThanOrEqual(2000);
});

test('TC-CT-018 | Page/Screen Name 300 chars handled gracefully', async ({ page }) => {
  const tp = await login(page);
  await page.locator('#txtPageName').fill(ticketData.boundary.pageNameLong);
  await tp.fillRequiredFields(ticketData.validTicket.project, ticketData.validTicket.type, ticketData.validTicket.platform, 'Valid description for page name boundary test.');
  await tp.clickSubmit();
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

// ── SECURITY ──────────────────────────────────────────────────────────────────
test('TC-CT-019 | Unauthenticated access redirects to login', async ({ browser }) => {
  const { page, ctx } = await unauthAccess(browser, '/Ticket/Create');
  await expect(page).toHaveURL(/Login|Account/i);
  await ctx.close();
});

test('TC-CT-020 | SQL injection in description handled safely', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.sqlInjection);
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-021 | XSS payload in description does not execute', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.xssPayload + ' valid text');
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-022 | HTML injection in description is sanitised', async ({ page }) => {
  const tp = await login(page);
  await tp.selectProject(ticketData.validTicket.project); await tp.clickTypeChip(ticketData.validTicket.type); await tp.clickPlatformChip(ticketData.validTicket.platform);
  await tp.enterDescription(ticketData.security.htmlInjection + ' valid text here');
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-023 | XSS payload in Page/Screen Name does not execute', async ({ page }) => {
  const tp = await login(page);
  await page.locator('#txtPageName').fill(ticketData.security.xssPageName);
  await tp.fillRequiredFields(ticketData.validTicket.project, ticketData.validTicket.type, ticketData.validTicket.platform, 'Valid description for XSS page name security test here.');
  await page.evaluate(() => document.querySelector('#btnHeaderSubmit').click());
  await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
  await tp.dismissSwal();
});

test('TC-CT-024 | Cancel Reset dialog retains all form fields', async ({ page }) => {
  const tp = await login(page);
  await tp.enterDescription('This text should remain after cancel reset test.');
  await tp.resetButton.click();
  await expect(tp.swalPopup).toBeVisible({ timeout: 4000 });
  const denyBtn = page.locator('.swal2-deny, .swal2-cancel');
  if (await denyBtn.isVisible().catch(() => false)) { await denyBtn.click(); }
  else { const btns = page.locator('.swal2-actions button'); if (await btns.count() > 1) await btns.nth(1).click(); }
  await page.waitForTimeout(500);
  expect((await page.locator('#txtDescription').inputValue()).length).toBeGreaterThan(0);
});
