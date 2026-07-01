// CI trigger: AddNewUser scope — 2026-07-01
// tests/addnewuser.spec.js — Add New User (Admin/Partners)
// CustomerConnect QA | Uses shared loginHelper
'use strict';
const { test, expect }  = require('@playwright/test');
const AddNewUserPage     = require('../pages/AddNewUserPage');
const { loginAndGoTo, unauthAccess, nativeFill, dxPick } = require('../utils/loginHelper');
const config = require('../utils/config');
const d      = require('../test-data/addNewUserData');

const login = (page) => loginAndGoTo(page, '/Admin/Partners', AddNewUserPage);

const openModal = async (page) => {
  await page.locator('#btnAddUser').click();
  await page.locator('#fFirstName').waitFor({ timeout: 8000 });
};
const closeModal = async (page) => {
  await page.locator('#feedbackCloseBtn').click().catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('button.um-modal-close').click().catch(() => {});
  await page.waitForTimeout(400);
};
const successShown = async (page) => {
  try { await page.locator('#feedbackModalOverlay.open').waitFor({ timeout: 5000 }); return true; }
  catch(_) { return false; }
};

// ── POSITIVE ──────────────────────────────────────────────────────────────────
test('TC-AU-007 | Page loads with heading, stats, grid, Add New User button', async ({ page }) => {
  const ap = await login(page);
  await expect(page.locator('h1')).toContainText('User Management');
  await expect(ap.addNewUserBtn).toBeVisible();
  await expect(ap.grid).toBeVisible();
});

test('TC-AU-001 | Create Partner Admin — Automatic password', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('PA'); await openModal(page);
  await nativeFill(page, '#fFirstName', u.firstName);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await expect(ap.wrapCustomer).toHaveCSS('display','none'); // hidden for Partner Admin
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-002 | Create Partner User — Automatic password', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('PU'); await openModal(page);
  await nativeFill(page, '#fFirstName', u.firstName);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner User');
  await page.waitForTimeout(500);
  await expect(ap.wrapCustomer).not.toHaveCSS('display','none');
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-003 | Create user with Manual password', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('Man'); await openModal(page);
  await nativeFill(page, '#fFirstName', u.firstName);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.passManualRadio.click(); await page.waitForTimeout(300);
  await expect(ap.passwordInput).toBeVisible();
  await nativeFill(page, '#fPassword', 'Test@12345');
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-005 | Create user with Inactive status', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('Inact'); await openModal(page);
  await nativeFill(page, '#fFirstName', u.firstName);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.statusInactive.click();
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-008 | Cancel button closes modal without saving', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await nativeFill(page, '#fFirstName', 'Will Not Save');
  await ap.cancelBtn.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-006 | Close (✕) button dismisses modal', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await ap.modalClose.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-019 | Single character First Name (min boundary) accepted', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('Min'); await openModal(page);
  await nativeFill(page, '#fFirstName', 'A');
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click();
  expect(await successShown(page)).toBe(true);
  await closeModal(page);
});

// ── NEGATIVE ──────────────────────────────────────────────────────────────────
test('TC-AU-013 | Empty form submit shows all validation errors', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errFirstName).toHaveText('First name is required');
  await expect(ap.errUsername).toHaveText('Username is required');
  await expect(ap.errRole).toHaveText('Please select a user role');
});

test('TC-AU-010 | Empty First Name shows validation error', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await nativeFill(page, '#fUsername', 'qa_nofn_test');
  await nativeFill(page, '#fEmail', 'qa.nofn@digitsrtm.com');
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.errFirstName).toHaveText('First name is required');
});

test('TC-AU-017 | Invalid email format shows validation error', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await nativeFill(page, '#fFirstName', 'QA Test');
  await nativeFill(page, '#fUsername', 'qa_bademail_t');
  await nativeFill(page, '#fEmail', 'notanemail');
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.errEmail).toContainText('email');
});

test('TC-AU-018 | Partner User without customer shows validation error', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('PUNoC'); await openModal(page);
  await nativeFill(page, '#fFirstName', u.firstName);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner User'); await page.waitForTimeout(500);
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errCustomer).toHaveText('Please select a customer');
});

test('TC-AU-015 | Duplicate username — silent failure BUG-AU-001', async ({ page }) => {
  const ap = await login(page); await openModal(page);
  await nativeFill(page, '#fFirstName', 'QA DupUser');
  await nativeFill(page, '#fUsername',  d.existingUsers.username);
  await nativeFill(page, '#fEmail',     `qa.dup.${Date.now().toString().slice(-6)}@digitsrtm.com`);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(3000);
  // BUG-AU-001: error should be visible — currently fails (silent failure)
  await expect(ap.errUsername).toBeVisible();
});

// ── SECURITY ──────────────────────────────────────────────────────────────────
test('TC-AU-022 | Unauthenticated access redirects to login', async ({ browser }) => {
  const { page, ctx } = await unauthAccess(browser, '/Admin/Partners');
  await expect(page).toHaveURL(/Login|Account/i);
  await ctx.close();
});

test('TC-AU-021 | XSS payload in First Name does not execute', async ({ page }) => {
  const ap = await login(page);
  const u = d.tsUser('Xss'); await openModal(page);
  await nativeFill(page, '#fFirstName', d.security.xss);
  await nativeFill(page, '#fUsername',  u.username);
  await nativeFill(page, '#fEmail',     u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
});
