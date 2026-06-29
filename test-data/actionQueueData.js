// test-data/actionQueueData.js
// All test data for ActionQueue module
// CustomerConnect QA Pipeline — never hardcode in spec files

module.exports = {

  // ── Auth ─────────────────────────────────────────────────────────────
  validUser: { username: 'sajith_xyz', password: 'User@123' },

  // ── Ticket IDs ───────────────────────────────────────────────────────
  knownTicketId:       1345,
  nonExistentTicketId: 99999,

  // ── Search ───────────────────────────────────────────────────────────
  validSearchTerm:    'YSG Loyalty-8924-1',
  noResultSearchTerm: 'XXXXNONEXIST9999',

  // ── Decision Remarks ─────────────────────────────────────────────────
  validApproveRemarks: 'Fix verified. UAT requirements met. Approved to proceed to production.',
  validReopenRemarks:  'Fix incomplete. Login page still crashes on mobile. Please review and retest.',
  singleCharRemarks:   'A',
  longRemarks:         'A'.repeat(1000),
  whitespaceRemarks:   '     ',

  // ── Security Payloads ────────────────────────────────────────────────
  sqlInjectionRemarks: "'; DROP TABLE tickets; --",
  xssPayloadRemarks:   "<script>alert('xss')</script>",

  // ── Expected UI Text ─────────────────────────────────────────────────
  approveDialogConfirmText: 'By approving, you confirm that the fix meets the UAT requirements.',
  reopenDialogConfirmText:  'By reopening, you indicate that the fix requires further development work.',
  remarksValidationError:   'Decision remarks are mandatory',

  // ── Expected Columns ─────────────────────────────────────────────────
  expectedColumns: [
    'Action','Tracker #','Project','Description','Platform',
    'Reported By','Created','Priority','Current Stage','UAT Due',
  ],

  // ── URLs ──────────────────────────────────────────────────────────────
  listURL:      '/Tickets/ActionQueue',
  detailURL:    (id) => `/Ticket/ActionQueueDetails/${id}`,
};
