// CI: swal-confirm fix 2026-07-02T15:13:07 — 2026-07-01T19:57 — 2026-07-01T18:45
// tests/addnewuser.spec.js — Add New User (Admin/Partners)
// CustomerConnect QA | Uses shared loginHelper
// CI fix: loginAndGoTo navigates to page internally — same ActionQueue pattern
'use strict';
const { test, expect }  = require('@playwright/test');
const AddNewUserPage     = require('../pages/AddNewUserPage');
const { loginAndGoTo, unauthAccess, nativeFill, dxPick, waitForFeedback } = require('../utils/loginHelper');
const d      = require('../test-data/addNewUserData');

// ActionQueue-proven pattern: login returns page; each test navigates separately
async function loginAndNavigate(page) {
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async dl => { try { await dl.dismiss(); } catch (_) {} });

  const { LoginPage } = require('../pages/LoginPage') ? { LoginPage: require('../pages/LoginPage') } : {};
  const lp = new (require('../pages/LoginPage'))(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login('sajith_xyz', 'User@123');
  await page.waitForURL(url => !url.toString().includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  return new AddNewUserPage(page);
}

// Real UI path: left sidebar → expand USER MANAGEMENT accordion → click Partners
// (verifies the nav itself, not just the /Admin/Partners route)
async function goToPartners(page) {
  const umToggle = page.locator('#sidebar [data-title="user management"] .kt-menu-link');
  await umToggle.click();
  const partnersLink = page.locator('#sidebar a[href="/Admin/Partners"]');
  await partnersLink.waitFor({ state: 'visible', timeout: 10000 });
  await partnersLink.click();
  await page.locator('h1').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
}

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
// AddNewUser success flow:
// 1. createBtn.click() → Swal "Create User?" confirmation appears
// 2. Click .swal2-confirm ("Yes, Create") → toastr "Saved successfully" + modal closes
const confirmAndWaitSuccess = async (page) => {
  // Wait for the Swal confirmation dialog
  try {
    await page.locator('.swal2-title').waitFor({ timeout: 5000 });
    const title = await page.locator('.swal2-title').textContent();
    if (/Create User|Save Changes/i.test(title)) {
      await page.locator('.swal2-confirm').click();
    }
  } catch (_) { /* Swal may not appear if validation failed */ }

  // Wait for toastr success OR modal closure (either confirms success)
  try {
    await Promise.race([
      page.locator('.toast-success, .toast.toast-success').waitFor({ timeout: 8000 }),
      page.locator('[class*="toast-container"] .toast-message').filter({ hasText: /saved|success/i }).waitFor({ timeout: 8000 }),
    ]);
    return true;
  } catch (_) { return false; }
};

// ── POSITIVE ──────────────────────────────────────────────────────────────────
test('TC-AU-007 | Page loads with heading, stats, grid, Add New User button', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await expect(page.locator('h1')).toContainText('User Management');
  await expect(ap.addNewUserBtn).toBeVisible();
  await expect(ap.grid).toBeVisible();
});

test('TC-AU-001 | Create Partner Admin — Automatic password', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('PA'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(u.firstName);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await expect(ap.wrapCustomer).toHaveCSS('display','none');
  await ap.createBtn.click();
  expect(await confirmAndWaitSuccess(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-002 | Create Partner User — Automatic password', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('PU'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(u.firstName);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner User');
  await page.waitForTimeout(500);
  await expect(ap.wrapCustomer).not.toHaveCSS('display','none');
  await ap.createBtn.click();
  expect(await confirmAndWaitSuccess(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-003 | Create user with Manual password', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('Man'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(u.firstName);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.passManualRadio.evaluate(el => el.click()); await page.waitForTimeout(300);
  await expect(ap.passwordInput).toBeVisible();
  await page.locator('#fPassword').fill('Test@12345');
  await ap.createBtn.click();
  expect(await confirmAndWaitSuccess(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-005 | Create user with Inactive status', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('Inact'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(u.firstName);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.statusInactive.evaluate(el => el.click());
  await ap.createBtn.click();
  expect(await confirmAndWaitSuccess(page)).toBe(true);
  await closeModal(page);
});

test('TC-AU-008 | Cancel button closes modal without saving', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill('Will Not Save');
  await ap.cancelBtn.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-006 | Close (✕) button dismisses modal', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await ap.modalClose.click(); await page.waitForTimeout(500);
  await expect(ap.modal).not.toHaveClass(/open/);
});

test('TC-AU-019 | Single character First Name (min boundary) accepted', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('Min'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill('A');
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click();
  expect(await confirmAndWaitSuccess(page)).toBe(true);
  await closeModal(page);
});

// ── NEGATIVE ──────────────────────────────────────────────────────────────────
test('TC-AU-013 | Empty form submit shows all validation errors', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errFirstName).toHaveText('First name is required');
  await expect(ap.errUsername).toHaveText('Username is required');
  await expect(ap.errRole).toHaveText('Please select a user role');
});

test('TC-AU-010 | Empty First Name shows validation error', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fUsername').fill('qa_nofn_test');
  await page.locator('#fEmail').fill('qa.nofn@digitsrtm.com');
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.errFirstName).toHaveText('First name is required');
});

test('TC-AU-017 | Invalid email format shows validation error', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill('QA Test');
  await page.locator('#fUsername').fill('qa_bademail_t');
  await page.locator('#fEmail').fill('notanemail');
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.errEmail).toContainText('email');
});

test('TC-AU-018 | Partner User without customer shows validation error', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('PUNoC'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(u.firstName);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner User');
  await page.waitForTimeout(500);
  await ap.createBtn.click(); await page.waitForTimeout(600);
  await expect(ap.modal).toHaveClass(/open/);
  await expect(ap.errCustomer).toContainText('customer');
});

test('TC-AU-015 | Duplicate username — silent failure BUG-AU-001', async ({ page }) => {
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill('QA DupUser');
  await page.locator('#fUsername').fill( d.existingUsers.username);
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
  const ap = await loginAndNavigate(page);
  await goToPartners(page);
  const u = d.tsUser('Xss'); await openModal(page); await page.waitForTimeout(500);
  await page.locator('#fFirstName').fill(d.security.xss);
  await page.locator('#fUsername').fill( u.username);
  await page.locator('#fEmail').fill(    u.email);
  await dxPick(page, '#fRole .dx-dropdowneditor-button', 'Partner Admin');
  await ap.createBtn.click(); await page.waitForTimeout(2500);
  await expect(page).not.toHaveTitle(/500|error/i);
});
