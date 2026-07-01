// utils/loginHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL login helper — import this in EVERY spec file.
// Never define loginAndGetPage() locally in a spec again.
//
// Usage:
//   const { loginAndGoTo } = require('../utils/loginHelper');
//   const ap = await loginAndGoTo(page, '/Admin/Partners', AddNewUserPage);
//   const tp = await loginAndGoTo(page, '/Ticket/Create',  CreateTicketPage);
//
// Rules:
//   • Always uses addInitScript to suppress dialogs BEFORE page JS runs
//   • Always waits 30s for post-login URL change
//   • Always waits 2s KendoUI/SPA settle after navigation
//   • PageClass is optional — pass null to get the raw Playwright page back
// ─────────────────────────────────────────────────────────────────────────────
'use strict';
const config = require('./config');

/**
 * Login as sajith_xyz and navigate to targetPath.
 * @param {import('@playwright/test').Page} page
 * @param {string}  targetPath   e.g. '/Ticket/Create' or '/Admin/Partners'
 * @param {Function|null} PageClass  POM constructor — if provided, returns new PageClass(page)
 * @returns {Promise<import('@playwright/test').Page|object>}
 */
async function loginAndGoTo(page, targetPath, PageClass = null) {
  // ① Suppress native dialogs before any page JS can register them
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async d => { try { await d.dismiss(); } catch (_) {} });

  // ② Login
  await page.goto(`${config.baseURL}/Account/Login?ReturnUrl=%2F`, { waitUntil: 'domcontentloaded' });
  await page.locator('#UserName').fill('sajith_xyz');
  await page.locator('#Password').fill('User@123');
  await page.evaluate(() => document.querySelector('button[type="submit"]').click());
  await page.waitForURL(url => !url.includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  // ③ Navigate to target feature page
  if (targetPath) {
    await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
    await page.locator('h1').waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);   // KendoUI / SPA data settle
  }

  return PageClass ? new PageClass(page) : page;
}

/**
 * Unauthenticated access test helper.
 * Opens a fresh browser context with no session and navigates to targetPath.
 * Caller asserts: await expect(page).toHaveURL(/Login|Account/i)
 */
async function unauthAccess(browser, targetPath) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return { page, ctx };
}

/**
 * Native input setter — required for DX DevExtreme widgets and React-controlled inputs.
 * Plain .fill() doesn't always trigger framework reactivity.
 */
async function nativeFill(locatorOrPage, selectorOrLocator, value) {
  // Accept either (page, '#id', val) or (locator, null, val)
  const target = typeof selectorOrLocator === 'string'
    ? locatorOrPage.locator(selectorOrLocator)
    : selectorOrLocator;
  await target.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, v);
    else el.value = v;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

/**
 * DX SelectBox / TagBox pick — clicks the dropdown button and selects by text.
 * @param {import('@playwright/test').Page} page
 * @param {string} dropdownBtnSelector  e.g. '#fRole .dx-dropdowneditor-button'
 * @param {string} itemText             e.g. 'Partner Admin'
 */
async function dxPick(page, dropdownBtnSelector, itemText) {
  await page.locator(dropdownBtnSelector).click();
  await page.waitForTimeout(700);
  await page.locator('.dx-item.dx-list-item', { hasText: itemText }).first().click();
  await page.waitForTimeout(400);
}

module.exports = { loginAndGoTo, unauthAccess, nativeFill, dxPick };
