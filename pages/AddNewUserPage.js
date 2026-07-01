// pages/AddNewUserPage.js
// Page Object — Admin/Partners > Add New User modal
// URL: http://customerportal.dev-ts.online/Admin/Partners
//
// Key logic (from live JS analysis):
//   Partner Admin  → Customer/Project fields HIDDEN (#wrapCustomer display:none)
//   Partner User   → #fCustomerMulti (DX TagBox) + #fProjects shown
//   AVAILABLE_CUSTOMERS → [{id:3,name:"YSG"},{id:15,name:"YSG Inventory"}]
//   Validation     → inline errors via validateForm() (amber CSS outline, not swal)
//   Success        → #feedbackModalOverlay gets class 'open', #feedbackTitle='Success'

'use strict';
const BasePage = require('./BasePage');

class AddNewUserPage extends BasePage {
  constructor(page) {
    super(page);
    // ── List page ─────────────────────────────────────────────────────────────
    this.addNewUserBtn  = page.locator('#btnAddUser');
    this.searchInput    = page.locator('input[placeholder="Search records..."]');
    this.exportBtn      = page.locator('button', { hasText: 'EXPORT' });
    this.grid           = page.locator('[role="grid"]');
    this.pageHeading    = page.locator('h1');
    // ── Modal ─────────────────────────────────────────────────────────────────
    this.modal          = page.locator('#userModalOverlay');
    this.modalClose     = page.locator('button.um-modal-close');
    this.cancelBtn      = page.locator('button.um-btn-secondary');
    this.createBtn      = page.locator('button.um-btn-primary').last();
    // ── Feedback ──────────────────────────────────────────────────────────────
    this.feedbackOverlay = page.locator('#feedbackModalOverlay');
    this.feedbackTitle   = page.locator('#feedbackTitle');
    this.feedbackMsg     = page.locator('#feedbackMsg');
    this.feedbackDone    = page.locator('#feedbackCloseBtn');
    // ── Form fields ───────────────────────────────────────────────────────────
    this.firstName     = page.locator('#fFirstName');
    this.lastName      = page.locator('#fLastName');
    this.username      = page.locator('#fUsername');
    this.email         = page.locator('#fEmail');
    this.roleDropBtn   = page.locator('#fRole .dx-dropdowneditor-button');
    this.roleInput     = page.locator('#fRole input');
    this.custDropBtn   = page.locator('#fCustomerMulti .dx-dropdowneditor-button');
    this.projDropBtn   = page.locator('#fProjects .dx-dropdowneditor-button');
    this.statusActive  = page.locator('#fStatusActive');
    this.statusInactive= page.locator('#fStatusInactive');
    this.forceChange   = page.locator('#fForceChange');
    this.passwordInput = page.locator('#fPassword');
    this.passAutoRadio = page.locator('input[name="passType"]').first();
    this.passManualRadio= page.locator('input[name="passType"]').nth(1);
    this.wrapCustomer  = page.locator('#wrapCustomer');
    this.wrapProjects  = page.locator('#wrapProjects');
    // ── Validation ────────────────────────────────────────────────────────────
    this.errFirstName  = page.locator('#wrapFirstName .um-field-error');
    this.errUsername   = page.locator('#wrapUsername .um-field-error');
    this.errEmail      = page.locator('#wrapEmail .um-field-error');
    this.errRole       = page.locator('#wrapRole .um-field-error');
    this.errCustomer   = page.locator('#wrapCustomer .um-field-error');
  }

  async navigateToPage() {
    await this.page.goto(`${require('../utils/config').baseURL}/Admin/Partners`, { waitUntil: 'domcontentloaded' });
    await this.page.locator('h1').waitFor({ timeout: 15000 });
    await this.page.waitForTimeout(1000);
  }

  async openAddNewUserModal() {
    await this.addNewUserBtn.click();
    await this.page.locator('#fFirstName').waitFor({ timeout: 8000 });
    await this.page.waitForTimeout(500);
  }

  async fillTextField(locator, value) {
    // Use evaluate to set value via native setter (required for some form fields)
    await locator.evaluate((el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  async selectRole(roleName) {
    await this.roleDropBtn.click();
    await this.page.waitForTimeout(700);
    const item = this.page.locator('.dx-item.dx-list-item', { hasText: roleName });
    await item.first().click();
    await this.page.waitForTimeout(600);
  }

  async selectCustomers(customerNames) {
    // Only visible for Partner User role
    await this.custDropBtn.click();
    await this.page.waitForTimeout(700);
    for (const name of customerNames) {
      await this.page.locator('.dx-item.dx-list-item', { hasText: name }).first().click();
      await this.page.waitForTimeout(300);
    }
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  async selectProjects(projectNames) {
    await this.projDropBtn.click();
    await this.page.waitForTimeout(700);
    for (const name of projectNames) {
      await this.page.locator('.dx-item.dx-list-item', { hasText: name }).first().click();
      await this.page.waitForTimeout(300);
    }
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  async fillAndSubmitPartnerAdmin({ firstName, lastName = '', username, email, inactive = false, manual = false, password = '', forceChange = false }) {
    await this.fillTextField(this.firstName, firstName);
    if (lastName) await this.fillTextField(this.lastName, lastName);
    await this.fillTextField(this.username, username);
    await this.fillTextField(this.email, email);
    await this.selectRole('Partner Admin');
    if (inactive) await this.statusInactive.click();
    if (manual) {
      await this.passManualRadio.click();
      await this.fillTextField(this.passwordInput, password);
    }
    if (forceChange) await this.forceChange.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
    await this.createBtn.click();
  }

  async waitForSuccess(timeout = 5000) {
    await this.feedbackOverlay.locator(':scope.open').waitFor({ timeout });
  }

  async dismissSuccess() {
    await this.feedbackDone.click();
    await this.page.waitForTimeout(500);
    await this.modal.evaluate(el => el.classList.remove('open'));
  }

  isModalOpen() { return this.modal.evaluate(el => el.classList.contains('open')); }
}

module.exports = AddNewUserPage;
