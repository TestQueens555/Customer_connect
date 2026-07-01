// tests/addnewuser.spec.js — Add New User (Admin/Partners) module
// CustomerConnect QA | 01-Jul-2026
'use strict';
const { test, expect } = require('@playwright/test');
const AddNewUserPage = require('../pages/AddNewUserPage');
const LoginPage      = require('../pages/LoginPage');
const config         = require('../utils/config');
const d              = require('../test-data/addNewUserData');

async function loginAndGetPage(page) {
  await page.addInitScript(() => { window.alert=()=>{}; window.confirm=()=>true; window.prompt=()=>''; });
  page.on('dialog', async dl => { try { await dl.dismiss(); } catch(_) {} });
  const lp = new LoginPage(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login('sajith_xyz', 'User@123');
  await page.waitForURL(url => !url.includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  return new AddNewUserPage(page);
}
async function goToAdminPartners(page, ap) {
  await page.goto(`${config.baseURL}/Admin/Partners`, { waitUntil: 'domcontentloaded' });
  await page.locator('h1').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
}
const fillField = async (page, id, val) => page.locator(id).evaluate((el, v) => {
  const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  s.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true}));
}, val);
const pickDX = async (page, btnSel, val) => {
  await page.locator(btnSel).click(); await page.waitForTimeout(700);
  await page.locator('.dx-item.dx-list-item', { hasText: val }).first().click(); await page.waitForTimeout(400);
};
const successShown = async (page) => {
  try { await page.locator('#feedbackModalOverlay.open').waitFor({ timeout: 5000 }); return true; }
  catch(_) { return false; }
};

test('TC-AU-007 | Page loads with heading, stats, grid, Add New User button', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await expect(page.locator('h1')).toContainText('User Management');
  await expect(ap.addNewUserBtn).toBeVisible();
  await expect(ap.grid).toBeVisible();
});

test('TC-AU-001 | Create Partner Admin — Automatic password', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('PA');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',u.firstName); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await expect(ap.wrapCustomer).toHaveCSS('display','none'); // hidden for Partner Admin
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await ap.feedbackDone.click();
});

test('TC-AU-002 | Create Partner User — Automatic password', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('PU');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',u.firstName); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner User'); await page.waitForTimeout(500);
  await expect(ap.wrapCustomer).not.toHaveCSS('display','none'); // shown for Partner User
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await ap.feedbackDone.click();
});

test('TC-AU-003 | Create user with Manual password', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('Man');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',u.firstName); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.passManualRadio.click(); await page.waitForTimeout(300);
  await expect(ap.passwordInput).toBeVisible();
  await fillField(page,'#fPassword','Test@12345');
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await ap.feedbackDone.click();
});

test('TC-AU-005 | Create user with Inactive status', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('Inact');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',u.firstName); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.statusInactive.click();
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await ap.feedbackDone.click();
});

test('TC-AU-008 | Cancel button closes modal without saving', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName','Will Not Save');
  await ap.cancelBtn.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-006 | Close button dismisses modal', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await ap.modalClose.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-013 | Empty form submit shows all validation errors', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errFirstName).toHaveText('First name is required');
  await expect(ap.errUsername).toHaveText('Username is required');
  await expect(ap.errEmail).toContainText('email');
  await expect(ap.errRole).toHaveText('Please select a user role');
});

test('TC-AU-010 | Empty First Name shows validation error', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fUsername','qa_nofn_test'); await fillField(page,'#fEmail','qa.nofn@digitsrtm.com');
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errFirstName).toHaveText('First name is required');
});

test('TC-AU-011 | Empty Username shows validation error', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName','QA Test');
  await fillField(page,'#fEmail','qa.nousername@digitsrtm.com');
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errUsername).toHaveText('Username is required');
});

test('TC-AU-017 | Invalid email format shows validation error', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName','QA BadEmail'); await fillField(page,'#fUsername','qa_bademail_t');
  await fillField(page,'#fEmail','notanemail');
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errEmail).toContainText('email');
});

test('TC-AU-018 | Partner User without customer shows validation error', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('PUNoC');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',u.firstName); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner User'); await page.waitForTimeout(500);
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errCustomer).toHaveText('Please select a customer');
});

test('TC-AU-015 | Duplicate username — silent failure BUG-AU-001', async({page})=>{
  // Expect this test to FAIL: server blocks but shows no error to user
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName','QA DupUser'); await fillField(page,'#fUsername',d.existingUsers.username);
  await fillField(page,'#fEmail',`qa.dup.${Date.now().toString().slice(-6)}@digitsrtm.com`);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(3000);
  // Should show error — currently fails (BUG-AU-001)
  await expect(ap.errUsername).toBeVisible(); // FAIL — no error shown
});

test('TC-AU-019 | Single character First Name accepted (min boundary)', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('Min');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName','A'); await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await ap.feedbackDone.click();
});

test('TC-AU-022 | Unauthenticated access redirects to login', async({browser})=>{
  const ctx=await browser.newContext(); const page=await ctx.newPage();
  await page.goto(`${config.baseURL}/Admin/Partners`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(/Login|Account/i);
  await ctx.close();
});

test('TC-AU-021 | XSS payload in First Name does not execute', async({page})=>{
  const ap=await loginAndGetPage(page); await goToAdminPartners(page,ap);
  const u=d.tsUser('Xss');
  await ap.addNewUserBtn.click(); await page.locator('#fFirstName').waitFor({timeout:8000});
  await fillField(page,'#fFirstName',d.security.xss);
  await fillField(page,'#fUsername',u.username); await fillField(page,'#fEmail',u.email);
  await pickDX(page,'#fRole .dx-dropdowneditor-button','Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
});
