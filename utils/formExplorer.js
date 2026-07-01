// utils/formExplorer.js
// ─────────────────────────────────────────────────────────────────────────────
// ONE-CALL form discovery — call this at the start of Step 1 for any new page.
// Returns all form structure, window data vars, validation function source,
// DX component IDs, and conditional field logic in a single evaluate().
//
// Usage (in Playwright browser context):
//   const info = await page.evaluate(require('../utils/formExplorer').exploreScript);
//   console.log(JSON.stringify(info, null, 2));
//
// What it captures (eliminates 4–6 manual evaluate() probes):
//   • All window.* data variables (AVAILABLE_*, CONFIG, etc.)
//   • validateForm() / validate() source code
//   • All form field IDs, types, placeholders, required flags
//   • DX SelectBox / TagBox widget IDs and their data sources
//   • Conditional visibility logic (onRoleChange etc.)
//   • Submit / cancel button selectors
//   • Success/feedback element IDs
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

/**
 * Paste-ready evaluate function. Run with: page.evaluate(exploreScript)
 * Keep under 80 lines to avoid MCP timeout.
 */
const exploreScript = () => {
  const out = {};

  // ① Window data variables (AVAILABLE_*, MY_*, SESSION_*, ALL_*, CONFIG)
  out.windowVars = {};
  ['AVAILABLE_CUSTOMERS','AVAILABLE_PROJECTS','MY_PARTNER_ID','SESSION_USER_TYPE',
   'ALL_USERS','ROLE_CONFIG','CURRENT_CUSTOMER_ID','CONFIG','APP_CONFIG',
   'TICKET_TYPES','PLATFORMS'].forEach(k => {
    if (window[k] !== undefined) out.windowVars[k] = JSON.stringify(window[k]).slice(0, 300);
  });

  // ② Form fields (id, type, placeholder, required)
  out.formFields = [...document.querySelectorAll(
    'input:not([type="hidden"]), select, textarea, [class*="dx-selectbox"], [class*="dx-tagbox"]'
  )].filter(el => el.offsetParent !== null).map(el => ({
    id: el.id || null, tag: el.tagName,
    type: el.type || null, placeholder: el.placeholder || null,
    name: el.name || null, required: el.required || false,
    dxWidget: el.className.includes('dx-selectbox') ? 'selectbox'
             : el.className.includes('dx-tagbox')   ? 'tagbox' : null,
  })).filter(f => f.id || f.placeholder);

  // ③ Labels (maps field names to required/optional)
  out.labels = [...document.querySelectorAll('label')]
    .map(l => l.textContent.trim()).filter(Boolean);

  // ④ Submit / cancel / close buttons
  out.buttons = [...document.querySelectorAll('button')]
    .filter(b => b.offsetParent !== null)
    .map(b => ({ id: b.id || null, text: b.textContent.trim().slice(0,30), cls: b.className.slice(0,50) }))
    .filter(b => b.text);

  // ⑤ Validation function source (first 600 chars)
  const scripts = [...document.querySelectorAll('script:not([src])')];
  const valScript = scripts.find(s => s.textContent.includes('validateForm') || s.textContent.includes('validate('));
  if (valScript) {
    const t = valScript.textContent;
    const i = t.indexOf('function validate');
    out.validateFnSnippet = t.substring(i, i + 600);
  }

  // ⑥ Success / feedback element IDs
  out.feedbackEls = [...document.querySelectorAll('[id*="feedback"],[id*="success"],[id*="toast"],[class*="swal2-title"]')]
    .map(e => ({ id: e.id, cls: e.className.slice(0,40) }));

  // ⑦ Conditional logic function names (onRoleChange, onTypeChange, etc.)
  const allScripts = scripts.map(s => s.textContent).join(' ');
  out.conditionalFns = (allScripts.match(/function on\w+Change\s*\(/g) || []).map(f => f.replace('function ','').split('(')[0]);

  // ⑧ Page title and URL
  out.pageTitle = document.title;
  out.pageURL   = location.href;
  out.h1        = document.querySelector('h1')?.textContent?.trim();

  return out;
};

module.exports = { exploreScript };
