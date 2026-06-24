const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Locators (Priority: role > label > placeholder > ID > CSS) ──
    this.usernameInput = page.locator('#UserName, input[name="UserName"]');
    this.passwordInput = page.locator('#Password, input[name="Password"]');
    this.loginButton   = page.locator('input[type="submit"][value="Log in"], button[type="submit"]').first();
    this.errorMessage  = page.locator('.validation-summary-errors, .field-validation-error, [class*="error"], [class*="alert"]').first();
    this.pageHeading   = page.getByRole('heading').first();
  }

  async enterUsername(username) { await this.usernameInput.fill(username); }
  async enterPassword(password) { await this.passwordInput.fill(password); }

  async clickLoginButton() {
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  async clearUsername() { await this.usernameInput.clear(); }
  async clearPassword() { await this.passwordInput.clear(); }

  async getErrorMessage() {
    try { return await this.errorMessage.textContent(); } catch { return ''; }
  }

  async isErrorVisible() {
    try { return await this.errorMessage.isVisible(); } catch { return false; }
  }

  async isLoginButtonEnabled()  { return await this.loginButton.isEnabled(); }
  async isUsernameFieldVisible() { return await this.usernameInput.isVisible(); }
  async isPasswordFieldVisible() { return await this.passwordInput.isVisible(); }
  async getPageTitle()           { return await this.page.title(); }
}

module.exports = LoginPage;
