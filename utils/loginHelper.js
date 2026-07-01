// utils/loginHelper.js — Canonical login helper for all specs
// Always import from here — never define loginAndGetPage locally in a spec.
'use strict';
const config    = require('./config');
const LoginPage = require('../pages/LoginPage');

async function loginAndGoTo(page, targetPath, PageClass = null) {
  // Suppress dialogs before any page JS runs
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async d => { try { await d.dismiss(); } catch (_) {} });

  // Login using LoginPage (proven in ActionQueue CI)
  const lp = new LoginPage(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login('sajith_xyz', 'User@123');
  await page.waitForURL(url => !url.toString().includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);   // KendoUI / SPA settle

  // Navigate to target feature page
  if (targetPath) {
    await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
    await page.locator('h1').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  return PageClass ? new PageClass(page) : page;
}

async function unauthAccess(browser, targetPath) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return { page, ctx };
}

async function nativeFill(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function dxPick(page, dropdownBtnSelector, itemText) {
  await page.locator(dropdownBtnSelector).click();
  await page.waitForTimeout(700);
  await page.locator('.dx-item.dx-list-item', { hasText: itemText }).first().click();
  await page.waitForTimeout(400);
}

module.exports = { loginAndGoTo, unauthAccess, nativeFill, dxPick };
