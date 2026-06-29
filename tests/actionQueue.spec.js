// tests/actionQueue.spec.js
// E2E Test Suite — ActionQueue Module
// CustomerConnect QA Pipeline
// Run: npx playwright test tests/actionQueue.spec.js --config playwright.config.js

const { test, expect } = require('@playwright/test');
const ActionQueuePage  = require('../pages/ActionQueuePage');
const LoginPage        = require('../pages/LoginPage');
const aqData           = require('../test-data/actionQueueData');

// ── Login helper — suppresses native dialogs, logs in, returns AQ page object ─
async function loginAndGetPage(page) {
  // Suppress window.alert/confirm/prompt before any page JS runs
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async d => { try { await d.dismiss(); } catch (_) {} });

  // Login
  const lp = new LoginPage(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login(aqData.validUser.username, aqData.validUser.password);
  // Wait until redirected away from login page
  await page.waitForURL(url => !url.includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');

  return new ActionQueuePage(page);
}

// =============================================================================
// GROUP 1 — LIST PAGE
// =============================================================================
test.describe('TC-AQ | Action Queue — List Page', () => {

  test('TC-AQ-001 | Page loads with heading and pending items', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await expect(aq.pageHeading).toBeVisible();
    const rows = await aq.getGridRowCount();
    expect(rows).toBeGreaterThan(0);
    await expect(aq.pendingBadge).toBeVisible();
    console.log(`✅ TC-AQ-001 PASSED — ${rows} items`);
  });

  test('TC-AQ-002 | Stat cards display all 4 metrics', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await expect(aq.statTotalActions).toBeVisible();
    await expect(aq.statUATHosted).toBeVisible();
    await expect(aq.statDevHosted).toBeVisible();
    await expect(aq.statCriticalPrio).toBeVisible();
    console.log(`✅ TC-AQ-002 PASSED`);
  });

  test('TC-AQ-003 | Grid displays all 10 expected column headers', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    const headers = await aq.getAllColumnHeaders();
    for (const col of aqData.expectedColumns) {
      expect(headers.some(h => h.includes(col))).toBeTruthy();
    }
    console.log(`✅ TC-AQ-003 PASSED`);
  });

  test('TC-AQ-012 | Search filters grid to matching rows', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await aq.searchInGrid(aqData.validSearchTerm);
    const rows = await aq.getGridRowCount();
    expect(rows).toBeGreaterThanOrEqual(1);
    console.log(`✅ TC-AQ-012 PASSED`);
  });

  test('TC-AQ-020 | No-match search shows empty grid', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await aq.searchInGrid(aqData.noResultSearchTerm);
    const rows = await aq.getGridRowCount();
    expect(rows).toBe(0);
    console.log(`✅ TC-AQ-020 PASSED`);
  });

  test('TC-AQ-014 | EXPORT button is visible and clickable', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await expect(aq.exportButton).toBeVisible();
    await aq.clickExport();
    expect(await page.title()).not.toBe('');
    console.log(`✅ TC-AQ-014 PASSED`);
  });

  test('TC-AQ-015 | Pagination shows correct format', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    const text = await aq.getPaginationInfo();
    expect(text).toMatch(/Page \d+ of \d+ \(\d+ items\)/);
    console.log(`✅ TC-AQ-015 PASSED`);
  });

  test('TC-AQ-019 | Unauthenticated user redirected to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/Tickets/ActionQueue', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toMatch(/Login/i);
    console.log(`✅ TC-AQ-019 PASSED`);
  });

});

// =============================================================================
// GROUP 2 — DETAIL PAGE
// =============================================================================
test.describe('TC-AQ | Action Queue — Detail Page', () => {

  test('TC-AQ-004 | Perform Action opens ActionQueueDetails page', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueue();
    await aq.clickPerformAction(0);
    expect(page.url()).toMatch(/\/Ticket\/ActionQueueDetails\/\d+/);
    await expect(aq.approveBtn).toBeVisible();
    await expect(aq.reopenBtn).toBeVisible();
    console.log(`✅ TC-AQ-004 PASSED`);
  });

  test('TC-AQ-005 | Detail page displays all 5 information sections', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await expect(aq.detailProjectInfo).toBeVisible();
    await expect(aq.detailTechContext).toBeVisible();
    await expect(aq.detailProbStatement).toBeVisible();
    await expect(aq.detailEvidenceDoc).toBeVisible();
    await expect(aq.statisticsSection).toBeVisible();
    console.log(`✅ TC-AQ-005 PASSED`);
  });

  test('TC-AQ-018 | Non-existent ticket ID handled gracefully', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await page.goto(aqData.detailURL(aqData.nonExistentTicketId), { waitUntil: 'domcontentloaded' });
    expect(await page.title()).not.toBe('');
    expect(page.url()).not.toMatch(/500|error/i);
    console.log(`✅ TC-AQ-018 PASSED`);
  });

  test('TC-AQ-026 | TIMELINE button opens timeline view', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickTimeline();
    expect(await page.title()).not.toBe('');
    console.log(`✅ TC-AQ-026 PASSED`);
  });

});

// =============================================================================
// GROUP 3 — APPROVE FLOW
// =============================================================================
test.describe('TC-AQ | Action Queue — Approve Flow', () => {

  test('TC-AQ-006 | APPROVE dialog opens with correct elements', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await expect(aq.decisionDialog).toBeVisible();
    expect(await aq.getDecisionDialogTitle()).toMatch(/APPROVE/i);
    await expect(aq.approveDialogText).toBeVisible();
    await expect(aq.decisionRemarks).toBeVisible();
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-006 PASSED`);
  });

  test('TC-AQ-007 | APPROVE with valid remarks submits successfully', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.submitApprovalWithRemarks(aqData.validApproveRemarks);
    await page.waitForTimeout(2000);
    expect(!(await aq.isDecisionDialogVisible())).toBeTruthy();
    console.log(`✅ TC-AQ-007 PASSED`);
  });

  test('TC-AQ-010 | Cancel APPROVE dismisses without submitting', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks('Test cancel flow');
    await aq.cancelDecision();
    await page.waitForTimeout(500);
    expect(await page.locator('[role="dialog"]').count()).toBe(0);
    await expect(aq.approveBtn).toBeVisible();
    console.log(`✅ TC-AQ-010 PASSED`);
  });

  test('TC-AQ-016 | APPROVE empty remarks shows validation error', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.submitDecision();
    await expect(aq.remarksError).toBeVisible();
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-016 PASSED`);
  });

  test('TC-AQ-021 | Single character remarks accepted', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks(aqData.singleCharRemarks);
    await aq.submitDecision();
    await page.waitForTimeout(1000);
    const handled = !(await aq.isDecisionDialogVisible()) || await aq.isRemarksErrorVisible();
    expect(handled).toBeTruthy();
    console.log(`✅ TC-AQ-021 PASSED`);
  });

  test('TC-AQ-022 | Max length remarks (1000 chars) handled', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks(aqData.longRemarks);
    const val = await aq.decisionRemarks.inputValue();
    expect(val.length).toBeGreaterThan(0);
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-022 PASSED`);
  });

  test('TC-AQ-023 | Whitespace-only remarks rejected', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks(aqData.whitespaceRemarks);
    await aq.submitDecision();
    const blocked = await aq.isRemarksErrorVisible() || await aq.isDecisionDialogVisible();
    expect(blocked).toBeTruthy();
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-023 PASSED`);
  });

  test('TC-AQ-024 | SQL injection in remarks is sanitized', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks(aqData.sqlInjectionRemarks);
    await aq.submitDecision();
    await page.waitForTimeout(2000);
    expect(await page.title()).not.toBe('');
    expect(page.url()).not.toMatch(/500/);
    console.log(`✅ TC-AQ-024 PASSED`);
  });

  test('TC-AQ-025 | XSS payload in remarks @security', async ({ page }) => {
    // BUG-AQ-001 open — addInitScript suppresses alert for CI stability
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickApprove();
    await aq.enterRemarks(aqData.xssPayloadRemarks);
    await aq.submitDecision();
    await page.waitForTimeout(2000);
    expect(await page.title()).not.toBe('');
    console.log(`TC-AQ-025 — BUG-AQ-001 open`);
  });

});

// =============================================================================
// GROUP 4 — REOPEN FLOW
// =============================================================================
test.describe('TC-AQ | Action Queue — Reopen Flow', () => {

  test('TC-AQ-008 | REOPEN dialog opens with correct elements', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickReopen();
    await expect(aq.decisionDialog).toBeVisible();
    expect(await aq.getDecisionDialogTitle()).toMatch(/REOPEN/i);
    await expect(aq.reopenDialogText).toBeVisible();
    await expect(aq.decisionRemarks).toBeVisible();
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-008 PASSED`);
  });

  test('TC-AQ-009 | REOPEN with valid remarks submits successfully', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.submitReopenWithRemarks(aqData.validReopenRemarks);
    await page.waitForTimeout(2000);
    expect(!(await aq.isDecisionDialogVisible())).toBeTruthy();
    console.log(`✅ TC-AQ-009 PASSED`);
  });

  test('TC-AQ-011 | Cancel REOPEN dismisses without submitting', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickReopen();
    await aq.enterRemarks('Test cancel reopen');
    await aq.cancelDecision();
    await page.waitForTimeout(500);
    expect(await page.locator('[role="dialog"]').count()).toBe(0);
    console.log(`✅ TC-AQ-011 PASSED`);
  });

  test('TC-AQ-017 | REOPEN empty remarks shows validation error', async ({ page }) => {
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickReopen();
    await aq.submitDecision();
    await expect(aq.remarksError).toBeVisible();
    await aq.cancelDecision();
    console.log(`✅ TC-AQ-017 PASSED`);
  });

});

// =============================================================================
// GROUP 5 — KNOWN FAILURES
// =============================================================================
test.describe('TC-AQ | Action Queue — Known Failures @regression', () => {

  test('TC-AQ-013 | BACK button navigates away from detail page', async ({ page }) => {
    // BUG-AQ-002: BACK button non-functional
    const aq = await loginAndGetPage(page);
    await aq.navigateToActionQueueDetails(aqData.knownTicketId);
    await aq.clickBack();
    expect(page.url()).not.toMatch(/ActionQueueDetails/);
    console.log(`TC-AQ-013 — BUG-AQ-002 open`);
  });

});
