const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // ── Locators — confirmed live on http://customerportal.dev-ts.online ──
    this.usernameInput = page.locator('#UserName');
    this.passwordInput = page.locator('#Password');
    this.rememberMe    = page.locator('#RememberMe');
    this.signInButton  = page.locator('button[type="submit"]');
    this.pwdToggle     = page.locator('button[type="button"]').first();
    // Error: span.text-sm.font-medium → "Invalid user name or password"
    this.errorMessage  = page.locator('span.text-sm.font-medium');
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  async enterUsername(username)  { await this.usernameInput.fill(username); }
  async enterPassword(password)  { await this.passwordInput.fill(password); }
  async checkRememberMe()        { await this.rememberMe.check(); }
  async togglePasswordVisibility(){ await this.pwdToggle.click(); await this.passwordInput.waitFor({ state: 'visible' }); }

  async clickSignIn() {
    // Use JS click to avoid navigation timeout on slow responses (e.g. SQL payloads)
    await this.page.evaluate(() => document.querySelector('button[type="submit"]').click());
    // Wait for either navigation away from login page OR error message to appear
    await Promise.race([
      this.page.waitForURL(url => !url.includes('Login'), { timeout: 8000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
    ]);
  }

  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  async getErrorMessage() {
    try { return (await this.errorMessage.textContent({ timeout: 3000 })).trim(); }
    catch { return ''; }
  }

  async isErrorVisible()         { return await this.errorMessage.isVisible().catch(() => false); }
  async isUsernameFieldVisible() { return await this.usernameInput.isVisible().catch(() => false); }
  async isPasswordFieldVisible() { return await this.passwordInput.isVisible().catch(() => false); }
  async isSignInButtonVisible()  { return await this.signInButton.isVisible().catch(() => false); }
  async isRememberMeVisible()    { return await this.rememberMe.isVisible().catch(() => false); }
  async getPasswordInputType()   { return await this.passwordInput.getAttribute('type'); }
  async getPageTitle()           { return await this.page.title(); }
}

module.exports = LoginPage;
