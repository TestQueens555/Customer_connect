// Environment configuration — never hardcode these in tests
module.exports = {
  baseURL:  'http://customerportal.dev-ts.online',
  loginURL: 'http://customerportal.dev-ts.online/Account/Login?ReturnUrl=%2F',
  browser:  'chromium',
  headless: true,
  timeout:  30000,
};
