const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // ── Locators — from live UI inspection ──────────────────────────
    this.usernameInput  = page.locator('#UserName');
    this.passwordInput  = page.locator('#Password');
    this.rememberMe     = page.locator('#RememberMe');
    this.signInButton   = page.locator('button[type="submit"]');
    this.errorAlert     = page.locator('.kt-alert-destructive').first();
    this.pageTitle      = page.locator('h1, h2, h3').first();
  }

  async enterUsername(username) { await this.usernameInput.fill(username); }
  async enterPassword(password) { await this.passwordInput.fill(password); }
  async checkRememberMe()       { await this.rememberMe.check(); }

  async clickSignIn() {
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  async getErrorMessage() {
    try { return (await this.errorAlert.textContent()).trim(); } catch { return ''; }
  }

  async isErrorVisible()         { return await this.errorAlert.isVisible().catch(() => false); }
  async isUsernameFieldVisible() { return await this.usernameInput.isVisible().catch(() => false); }
  async isPasswordFieldVisible() { return await this.passwordInput.isVisible().catch(() => false); }
  async isSignInButtonVisible()  { return await this.signInButton.isVisible().catch(() => false); }
  async isRememberMeVisible()    { return await this.rememberMe.isVisible().catch(() => false); }
  async getPasswordInputType()   { return await this.passwordInput.getAttribute('type'); }
  async getPageTitle()           { return await this.page.title(); }
}

module.exports = LoginPage;
