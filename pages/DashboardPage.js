const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    // ── Locators — from live UI inspection ──────────────────────────
    this.pageHeading      = page.locator('h1').first();
    this.subtitle         = page.locator('p').first();
    this.lastUpdated      = page.locator('[class*="updated"]').first();

    // Tabs
    this.overviewBtn      = page.locator('#btnOverview');
    this.analyticsBtn     = page.locator('#btnAnalytics');

    // Date range
    this.dateRangeToggle  = page.locator('#date_range_toggle');
    this.dateFrom         = page.locator('#dr_from');
    this.dateTo           = page.locator('#dr_to');
    this.applyRangeBtn    = page.locator('#dr_apply');
    this.resetBtn         = page.locator('button:has-text("Reset")').first();
    this.anFilterFrom     = page.locator('#an_filter_from');
    this.anFilterTo       = page.locator('#an_filter_to');

    // Stat cards
    this.statTotalTickets    = page.getByText('TOTAL TICKETS');
    this.statOpenTickets     = page.getByText('OPEN TICKETS');
    this.statResolvedTickets = page.getByText('RESOLVED TICKETS');
    this.statCriticalIssues  = page.getByText('CRITICAL ISSUES');

    // Active Tickets table
    this.activeTicketsTable  = page.locator('table').first();
    this.tableHeaders        = page.locator('table th');
    this.tableRows           = page.locator('table tbody tr');
    this.viewAllLink         = page.locator('a[href="/Ticket/Index"]:has-text("View All")').first();

    // Sidebar nav
    this.createTicketLink    = page.locator('a[href="/Ticket/Create"]').first();
    this.actionQueueLink     = page.locator('a[href="/Tickets/ActionQueue"]').first();
    this.viewTicketsLink     = page.locator('a[href="/Ticket/Index"]').first();
    this.summaryReportLink   = page.locator('a[href="/Report/CustomerSupport"]').first();

    // Search
    this.searchBox           = page.locator('input[placeholder="Search"]').first();

    // User profile
    this.userProfileBtn      = page.getByTitle('User Profile');
    this.signOutLink         = page.locator('a[href="/Account/Logout"]').first();
    this.myProfileLink       = page.locator('a[href="/Profile"]').first();
  }

  async clickOverview()        { await this.overviewBtn.click(); await this.page.waitForTimeout(500); }
  async clickAnalytics()       { await this.analyticsBtn.click(); await this.page.waitForTimeout(500); }
  async clickDateRangeToggle() { await this.dateRangeToggle.click(); await this.page.waitForTimeout(500); }
  async clickViewAll()         { await this.viewAllLink.click(); await this.page.waitForLoadState('networkidle'); }
  async clickUserProfile()     { await this.userProfileBtn.click(); await this.page.waitForTimeout(500); }

  async applyDateRange(from, to) {
    await this.clickDateRangeToggle();
    await this.dateFrom.fill(from);
    await this.dateTo.fill(to);
    await this.applyRangeBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickReset() {
    await this.resetBtn.click();
    await this.page.waitForTimeout(500);
  }

  async typeInSearch(text) { await this.searchBox.fill(text); }

  async getPageHeading()   { return (await this.pageHeading.textContent()).trim(); }
  async getPageTitle()     { return await this.page.title(); }
  async getTableRowCount() { return await this.tableRows.count(); }
  async getTableHeaders()  { return await this.tableHeaders.allTextContents(); }

  async isStatCardVisible(name) {
    return await this.page.getByText(name).isVisible().catch(() => false);
  }

  async isAnalyticsFilterVisible() {
    return await this.anFilterFrom.isVisible().catch(() => false);
  }

  async hasCrashed() {
    const body = await this.page.evaluate(() => document.body.innerText.toLowerCase());
    return body.includes('exception') || body.includes('server error') || body.includes(' 500 ');
  }
}

module.exports = DashboardPage;
