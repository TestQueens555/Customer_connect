// global-setup.js — runs once before all tests, creates auth session
const { chromium } = require('@playwright/test');
const path = require('path');
const config = require('./utils/config');
const loginData = require('./test-data/loginData');

module.exports = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(config.loginURL, { waitUntil: 'domcontentloaded' });
  await page.locator('#UserName').fill(loginData.validUser.username);
  await page.locator('#Password').fill(loginData.validUser.password);
  await page.evaluate(() => document.querySelector('button[type="submit"]').click());
  await page.waitForURL(/^(?!.*Login).*$/, { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');

  await ctx.storageState({ path: path.join(__dirname, 'reports/auth-session.json') });
  await browser.close();
  console.log('✅ Auth session saved');
};
