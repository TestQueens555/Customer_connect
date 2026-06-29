// pages/ActionQueuePage.js
// Page Object for ActionQueue module
// CustomerConnect QA Pipeline

const BasePage = require('./BasePage');

class ActionQueuePage extends BasePage {
  constructor(page) {
    super(page);

    // ── List Page Locators ─────────────────────────────────────────────
    this.pageHeading       = page.locator('h1').filter({ hasText: 'Action Queue' });
    this.pendingBadge      = page.locator('text=7 Pending Actions');
    this.searchInput       = page.getByPlaceholder('Search actions...');
    this.exportButton      = page.getByRole('button', { name: /EXPORT/i });
    this.dataGrid          = page.locator('[role="grid"]');
    this.gridRows          = page.locator('[role="grid"] [role="row"]');
    this.performActionBtns = page.locator('[title="Perform Action"]');
    this.paginationInfo    = page.locator('text=/Page \\d+ of \\d+/');

    // ── Stat Cards ─────────────────────────────────────────────────────
    this.statTotalActions  = page.locator('p:has-text("Total Actions")').locator('..').locator('h3');
    this.statUATHosted     = page.locator('p:has-text("UAT / Demo Hosted")').locator('..').locator('h3');
    this.statDevHosted     = page.locator('p:has-text("Dev Hosted / Completed")').locator('..').locator('h3');
    this.statCriticalPrio  = page.locator('p:has-text("Critical Priority")').locator('..').locator('h3');

    // ── Detail Page Locators ───────────────────────────────────────────
    this.detailTitle         = page.locator('h1');
    this.detailProjectInfo   = page.locator('text=Project Information').first();
    this.detailTechContext   = page.locator('text=Technical Context').first();
    this.detailProbStatement = page.locator('text=Problem Statement').first();
    this.detailEvidenceDoc   = page.locator('text=Evidential Documentation').first();
    this.resolutionDeskLabel = page.locator('text=RESOLUTION DESK');
    this.approveBtn          = page.getByRole('button', { name: /APPROVE/i });
    this.reopenBtn           = page.getByRole('button', { name: /REOPEN/i });
    this.backBtn             = page.getByRole('button', { name: /BACK/i });
    this.timelineBtn         = page.getByRole('button', { name: /TIMELINE/i });
    this.statisticsSection   = page.locator('text=Statistics').first();

    // ── Decision Dialog ────────────────────────────────────────────────
    this.decisionDialog      = page.locator('[role="dialog"]');
    this.decisionDialogTitle = page.locator('[role="dialog"] h2');
    this.decisionRemarks     = page.getByPlaceholder('Add details or feedback for the team...');
    this.submitDecisionBtn   = page.getByRole('button', { name: 'Submit Decision' });
    this.cancelDecisionBtn   = page.getByRole('button', { name: 'Cancel' });
    this.remarksError        = page.locator('text=Decision remarks are mandatory');
    this.approveDialogText   = page.locator('text=By approving, you confirm that the fix meets the UAT requirements.');
    this.reopenDialogText    = page.locator('text=By reopening, you indicate that the fix requires further development work.');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async navigateToActionQueue() {
    await this.page.goto('/Tickets/ActionQueue', { waitUntil: 'domcontentloaded' });
    // Wait for page heading — reliable signal the page loaded correctly after login
    await this.pageHeading.waitFor({ state: 'visible', timeout: 30000 });
    // Extra settle time for KendoUI grid to initialise
    await this.page.waitForTimeout(2000);
  }

  async navigateToActionQueueDetails(ticketId) {
    await this.page.goto(`/Ticket/ActionQueueDetails/${ticketId}`, { waitUntil: 'domcontentloaded' });
    // Wait for ticket title heading
    await this.detailTitle.waitFor({ state: 'visible', timeout: 30000 });
    // Extra settle for Resolution Desk panel
    await this.page.waitForTimeout(2000);
  }

  // ── List Page Actions ──────────────────────────────────────────────────────
  async searchInGrid(searchTerm) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(800);
  }

  async clickPerformAction(rowIndex = 0) {
    await this.performActionBtns.nth(rowIndex).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.detailTitle.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(2000);
  }

  async clickExport() { await this.exportButton.click(); }

  // ── Detail Page Actions ────────────────────────────────────────────────────
  async clickApprove() {
    await this.approveBtn.click();
    await this.decisionDialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickReopen() {
    await this.reopenBtn.click();
    await this.decisionDialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickBack() {
    await this.backBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickTimeline() {
    await this.timelineBtn.click();
    await this.page.waitForTimeout(1500);
  }

  // ── Dialog Actions ─────────────────────────────────────────────────────────
  async enterRemarks(text)   { await this.decisionRemarks.fill(text); }
  async submitDecision()     { await this.submitDecisionBtn.click(); await this.page.waitForTimeout(500); }
  async cancelDecision()     { await this.cancelDecisionBtn.click(); await this.page.waitForTimeout(500); }

  async submitApprovalWithRemarks(remarks) {
    await this.clickApprove();
    await this.enterRemarks(remarks);
    await this.submitDecision();
  }

  async submitReopenWithRemarks(remarks) {
    await this.clickReopen();
    await this.enterRemarks(remarks);
    await this.submitDecision();
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  async getGridRowCount()         { return await this.gridRows.count(); }
  async getStatTotalActions()     { return await this.statTotalActions.textContent(); }
  async isDecisionDialogVisible() { return await this.decisionDialog.isVisible(); }
  async getDecisionDialogTitle()  { return (await this.decisionDialogTitle.textContent()).trim(); }
  async isRemarksErrorVisible()   { return await this.remarksError.isVisible(); }
  async getPaginationInfo()       { return await this.paginationInfo.textContent(); }
  async getAllColumnHeaders()     { return await this.page.locator('[role="columnheader"]').allTextContents(); }
}

module.exports = ActionQueuePage;
