const BasePage = require('./BasePage');
const config   = require('../utils/config');

class CreateTicketPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageURL = `${config.baseURL}/Ticket/Create`;

    // ── Header buttons ────────────────────────────────────────────────
    this.submitButton      = page.locator('#btnHeaderSubmit');
    this.resetButton       = page.locator('#btnReset');
    this.browseFilesBtn    = page.locator('#btnBrowse');

    // ── Project dropdown ──────────────────────────────────────────────
    this.projectInput      = page.locator('input[placeholder="Select Project..."]');

    // ── Page/Screen Name ──────────────────────────────────────────────
    this.pageNameInput     = page.locator('#txtPageName');

    // ── Ticket Type (chips) ───────────────────────────────────────────
    this.typeChipsContainer = page.locator('#typeChips');

    // ── Platform (chips) ─────────────────────────────────────────────
    this.platformChipsContainer = page.locator('#platformChips');

    // ── Description ───────────────────────────────────────────────────
    this.descriptionInput  = page.locator('#txtDescription');
    this.charCounter       = page.locator('#descCount');

    // ── File upload ───────────────────────────────────────────────────
    this.fileInput         = page.locator('#fileInput');
    this.fileNameDisplay   = page.locator('.ct-file-name');

    // ── SweetAlert ────────────────────────────────────────────────────
    this.swalPopup         = page.locator('.swal2-popup');
    this.swalTitle         = page.locator('.swal2-title');
    this.swalContent       = page.locator('.swal2-html-container');
    this.swalConfirmBtn    = page.locator('.swal2-confirm');
  }

  async navigateToCreateTicket() {
    await this.page.goto(this.pageURL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('#btnHeaderSubmit', { timeout: 15000 });
    await this.page.waitForTimeout(500);
  }

  async selectProject(projectName) {
    await this.projectInput.click();
    await this.page.waitForTimeout(800);
    const item = this.page.locator('.dx-list-item', { hasText: projectName });
    await item.first().click({ force: true });
    await this.page.waitForTimeout(800);
  }

  async clickTypeChip(typeName) {
    const chip = this.typeChipsContainer.locator('.ct-type-chip', { hasText: typeName });
    await chip.first().click();
    await this.page.waitForTimeout(400);
  }

  async clickPlatformChip(platformName) {
    const chip = this.platformChipsContainer.locator('.ct-type-chip', { hasText: platformName });
    await chip.first().click();
    await this.page.waitForTimeout(400);
  }

  async enterDescription(text) {
    await this.descriptionInput.fill(text);
    await this.page.waitForTimeout(300);
  }

  async enterPageName(name) {
    await this.pageNameInput.fill(name);
  }

  async clickSubmit() {
    await this.submitButton.click();
    await Promise.race([
      this.swalPopup.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {}),
      this.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {}),
    ]);
  }

  async clickReset() {
    await this.resetButton.click();
    await this.swalPopup.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    if (await this.swalConfirmBtn.isVisible().catch(() => false)) {
      await this.swalConfirmBtn.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  async isSwalVisible() {
    return await this.swalPopup.isVisible().catch(() => false);
  }

  async getSwalTitle() {
    return (await this.swalTitle.textContent().catch(() => '')).trim();
  }

  async getSwalContent() {
    return (await this.swalContent.textContent().catch(() => '')).trim();
  }

  async dismissSwal() {
    if (await this.isSwalVisible()) {
      await this.swalConfirmBtn.click();
      await this.page.waitForTimeout(400);
    }
  }

  async getCharCount() {
    return (await this.charCounter.textContent().catch(() => '0 / 2000')).trim();
  }

  // Upload file via native file input
  async uploadFile(filePath) {
    await this.fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1500);
  }

  // Check file name shown in custom display span
  async getUploadedFileName() {
    return (await this.fileNameDisplay.textContent().catch(() => '')).trim();
  }

  // Fill all required fields using chip clicks
  async fillRequiredFields(project, typeChip, platformChip, description) {
    await this.selectProject(project);
    await this.clickTypeChip(typeChip);
    await this.clickPlatformChip(platformChip);
    await this.enterDescription(description);
  }
}

module.exports = CreateTicketPage;
