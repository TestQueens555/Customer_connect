const BasePage = require('./BasePage');
const config   = require('../utils/config');

class CreateTicketPage extends BasePage {
  constructor(page) {
    super(page);

    // ── URL ────────────────────────────────────────────────────────────
    this.pageURL = `${config.baseURL}/Ticket/Create`;

    // ── Section locators ───────────────────────────────────────────────
    this.pageHeading       = page.locator('h1, .page-title').first();
    this.resetButton       = page.getByRole('button', { name: /reset/i });
    this.submitButton      = page.getByRole('button', { name: /submit ticket/i });

    // ── Project dropdown (DevExtreme selectbox) ────────────────────────
    this.projectInput      = page.locator('input[placeholder="Select Project..."]');

    // ── Page/Screen Name ───────────────────────────────────────────────
    this.pageNameInput     = page.locator('#txtPageName');

    // ── Ticket Type dropdown + chips ───────────────────────────────────
    this.typeInput         = page.locator('input[placeholder="Select Type..."]');

    // ── Platform dropdown + chips ──────────────────────────────────────
    this.platformInput     = page.locator('input[placeholder="Select Platform..."]');

    // ── Description textarea (ID-based — avoids ambiguous CSS class match) ───
    this.descriptionInput  = page.locator('#txtDescription');
    this.charCounter       = page.locator('#descCount');

    // ── Attachment ─────────────────────────────────────────────────────
    this.fileInput         = page.locator('#fileInput');
    this.browseFilesBtn    = page.getByRole('button', { name: /browse files/i });

    // ── Validation / Alerts ────────────────────────────────────────────
    this.swalPopup         = page.locator('.swal2-popup');
    this.swalTitle         = page.locator('.swal2-title');
    this.swalContent       = page.locator('.swal2-html-container');
    this.swalConfirmBtn    = page.locator('.swal2-confirm');
    this.swalCancelBtn     = page.locator('.swal2-cancel');
    this.invalidControls   = page.locator('.dx-invalid, .invalid-control');

    // ── Success indicators ─────────────────────────────────────────────
    this.successToast      = page.locator('.toast-success, .swal2-success, [class*="success"]').first();
  }

  // ── Navigation ────────────────────────────────────────────────────────
  async navigateToCreateTicket() {
    await this.navigate(this.pageURL);
    await this.page.waitForLoadState('networkidle');
  }

  // ── Project selection ─────────────────────────────────────────────────
  async selectProject(projectName) {
    await this.projectInput.click();
    await this.projectInput.fill(projectName);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await this.projectInput.waitFor({ state: 'visible' });
  }

  async getSelectedProject() {
    return await this.projectInput.inputValue();
  }

  // ── Page/Screen Name ──────────────────────────────────────────────────
  async enterPageName(name) {
    await this.pageNameInput.fill(name);
  }

  // ── Ticket Type selection ─────────────────────────────────────────────
  async selectTicketType(typeName) {
    await this.typeInput.click();
    const item = this.page.locator('.dx-list-item', { hasText: typeName });
    await item.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    });
  }

  async clickTypeChip(typeName) {
    const chip = this.page.locator('[cursor=pointer]', { hasText: typeName }).first();
    await chip.click();
  }

  // ── Platform selection ────────────────────────────────────────────────
  async selectPlatform(platformName) {
    await this.platformInput.click();
    const item = this.page.locator('.dx-list-item', { hasText: platformName });
    await item.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    });
  }

  async clickPlatformChip(platformName) {
    const chip = this.page.locator('[cursor=pointer]', { hasText: platformName }).last();
    await chip.click();
  }

  // ── Description ───────────────────────────────────────────────────────
  async enterDescription(text) {
    await this.descriptionInput.fill(text);
  }

  async getCharCount() {
    const txt = await this.charCounter.textContent().catch(() => '0 / 2000');
    return txt.trim();
  }

  // ── Submit / Reset ────────────────────────────────────────────────────
  async clickSubmit() {
    await this.submitButton.click();
    // Wait for either a SweetAlert popup or a page navigation
    await Promise.race([
      this.swalPopup.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {}),
      this.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {}),
    ]);
  }

  async clickReset() {
    await this.resetButton.click();
    await this.swalPopup.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    // Confirm the SweetAlert "Reset Form?" dialog if it appears
    const confirmBtn = this.swalConfirmBtn;
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  // ── Validation helpers ────────────────────────────────────────────────
  async isSwalVisible() {
    return await this.swalPopup.isVisible().catch(() => false);
  }

  async getSwalTitle() {
    return await this.swalTitle.textContent().catch(() => '');
  }

  async getSwalContent() {
    return await this.swalContent.textContent().catch(() => '');
  }

  async dismissSwal() {
    if (await this.isSwalVisible()) {
      await this.swalConfirmBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async getInvalidControlCount() {
    return await this.invalidControls.count();
  }

  // ── Full valid ticket submission ───────────────────────────────────────
  async fillValidTicket(data) {
    await this.selectProject(data.project);
    if (data.pageName) await this.enterPageName(data.pageName);
    await this.selectTicketType(data.type);
    await this.selectPlatform(data.platform);
    await this.enterDescription(data.description);
  }

  // ── Platform locked check (true = no chips loaded yet) ───────────────
  async isPlatformLocked() {
    const chipCount = await this.page.locator('#platformChips .ct-type-chip').count();
    return chipCount === 0;
  }
}

module.exports = CreateTicketPage;
