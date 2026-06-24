const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.navMenu    = page.locator('nav, .navbar, [class*="nav"]').first();
    this.logoutLink = page.locator('a[href*="logout"], a[href*="Logout"], a:has-text("Logout"), a:has-text("Log out")').first();
  }

  async isLoggedIn() {
    return !this.page.url().includes('Login');
  }

  async logout() {
    await this.logoutLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isNavMenuVisible() {
    try { return await this.navMenu.isVisible(); } catch { return false; }
  }
}

module.exports = DashboardPage;
