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
  // Click the dropdown trigger
  await page.locator(dropdownBtnSelector).click();
  await page.waitForTimeout(800);   // wait for DX overlay animation in CI

  // Target ONLY the currently visible overlay — avoids stale list items from
  // previous dropdowns that may still be in the DOM (resolved immediately by first())
  const visibleItem = page.locator(
    '.dx-overlay-wrapper:not([style*="display: none"]) .dx-item.dx-list-item,' +
    '.dx-popup-wrapper:not([style*="display: none"]) .dx-item.dx-list-item'
  ).filter({ hasText: itemText });

  // Fallback: any visible list item with the text
  const fallbackItem = page.locator('.dx-item.dx-list-item:visible', { hasText: itemText });

  try {
    await visibleItem.first().click({ timeout: 5000 });
  } catch (_) {
    await fallbackItem.first().click({ timeout: 5000 });
  }
  await page.waitForTimeout(600);
}

module.exports = { loginAndGoTo, unauthAccess, nativeFill, dxPick };
