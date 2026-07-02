// utils/loginHelper.js — Canonical login helper for all specs
// Import this in every spec — never define loginAndGetPage locally.
'use strict';
const config    = require('./config');
const LoginPage = require('../pages/LoginPage');

// ── Login + Navigate ───────────────────────────────────────────────────────────
async function loginAndGoTo(page, targetPath, PageClass = null) {
  await page.addInitScript(() => {
    window.alert   = () => {};
    window.confirm = () => true;
    window.prompt  = () => '';
  });
  page.on('dialog', async d => { try { await d.dismiss(); } catch (_) {} });

  const lp = new LoginPage(page);
  await lp.navigate('/Account/Login?ReturnUrl=%2F');
  await lp.login('sajith_xyz', 'User@123');
  await page.waitForURL(url => !url.toString().includes('Login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  if (targetPath) {
    await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
    await page.locator('h1').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  return PageClass ? new PageClass(page) : page;
}

// ── Unauthenticated access helper ─────────────────────────────────────────────
async function unauthAccess(browser, targetPath) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${config.baseURL}${targetPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return { page, ctx };
}

// ── Native input setter ────────────────────────────────────────────────────────
// Required for DX DevExtreme / React controlled inputs.
// Plain page.fill() doesn't always trigger framework reactivity.
async function nativeFill(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

// ── DX SelectBox / TagBox picker ──────────────────────────────────────────────
// Targets ONLY the currently visible overlay — avoids stale list items from
// previous dropdowns that remain in the DOM after being dismissed.
async function dxPick(page, dropdownBtnSelector, itemText) {
  await page.locator(dropdownBtnSelector).click();
  await page.waitForTimeout(800);

  const visibleItem = page.locator(
    '.dx-overlay-wrapper:not([style*="display: none"]) .dx-item.dx-list-item,' +
    '.dx-popup-wrapper:not([style*="display: none"]) .dx-item.dx-list-item'
  ).filter({ hasText: itemText });

  const fallbackItem = page.locator('.dx-item.dx-list-item', { hasText: itemText });

  try {
    await visibleItem.first().click({ timeout: 5000 });
  } catch (_) {
    await fallbackItem.first().click({ timeout: 5000 });
  }
  await page.waitForTimeout(600);
}

// ── Universal feedback / success detector ─────────────────────────────────────
// Checks THREE indicators in parallel — works regardless of which overlay
// mechanism the page uses (class toggle, display change, or text update).
// Use this in every spec instead of page-specific hardcoded checks.
//
// Usage:
//   await submitButton.click();
//   const ok = await waitForFeedback(page);       // true = success, false = timeout
//   if (!ok) throw new Error('No success feedback after submit');
async function waitForFeedback(page, timeout = 14000) {
  try {
    await Promise.race([
      // Pattern A: SweetAlert2 success title
      page.locator('.swal2-title').filter({ hasText: /success|created|submitted|done/i })
          .waitFor({ timeout }),

      // Pattern B: Custom feedback panel title (e.g. #feedbackTitle = "Success")
      page.locator('[id*="feedbackTitle"],[id*="feedback-title"],[class*="feedback-title"]')
          .filter({ hasText: /success/i })
          .waitFor({ timeout }),

      // Pattern C: Any toast/banner showing success text
      page.locator('[class*="toast"],[class*="alert-success"],[class*="success-msg"],[class*="um-feedback"]')
          .filter({ hasText: /success|created|completed/i })
          .waitFor({ timeout }),

      // Pattern D: waitForFunction polling — catches dynamic DOM updates
      page.waitForFunction(() => {
        const candidates = [
          document.querySelector('#feedbackTitle'),
          document.querySelector('[class*="feedback"] [class*="title"]'),
          document.querySelector('.swal2-title'),
          document.querySelector('[class*="toast-title"]'),
        ];
        return candidates.some(el =>
          el && /success|created|submitted|completed/i.test(el.textContent?.trim())
        );
      }, { timeout }),
    ]);
    return true;
  } catch (_) {
    return false;
  }
}

// ── Dismiss feedback / close modal ────────────────────────────────────────────
// Clicks the feedback "Done/OK/Great" button then closes the modal if still open.
async function dismissFeedback(page) {
  const doneSelectors = [
    '#feedbackCloseBtn',
    '.swal2-confirm',
    'button:has-text("Done")',
    'button:has-text("OK")',
    'button:has-text("Great")',
    '[id*="feedback"] button',
  ];
  for (const sel of doneSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) { await btn.click(); break; }
    } catch (_) {}
  }
  await page.waitForTimeout(500);

  // Close the modal overlay if still open
  const closeSelectors = ['button.um-modal-close', '.modal-close', '[aria-label="Close"]'];
  for (const sel of closeSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) { await btn.click(); break; }
    } catch (_) {}
  }
  await page.waitForTimeout(400);
}

module.exports = { loginAndGoTo, unauthAccess, nativeFill, dxPick, waitForFeedback, dismissFeedback };
