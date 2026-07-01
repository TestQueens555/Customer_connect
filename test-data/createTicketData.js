// Create Ticket module — all test data in one place
// Updated 01-Jul-2026: platform chips corrected to match live UI
module.exports = {

  validTicket: {
    project:     'PRJ0008 - YSG Inventory',
    pageName:    'Dashboard',
    type:        'New',
    platform:    'Backend',
    description: 'This is a test ticket created by automated QA testing to verify the create ticket functionality works correctly.',
  },

  minimalTicket: {
    project:     'PRJ0021 - YSG Loyalty',
    pageName:    '',
    type:        'Improvement',
    platform:    'General',
    description: 'Minimal valid ticket with exactly fifteen chars.',
  },

  ticketTypes: ['New', 'Improvement', 'System Issue', 'Operational Issue', 'SCR', 'Not Feasible'],

  // Platform chips confirmed from live UI on 01-Jul-2026
  // Note: 'Flutter' chip replaced by 'SFA Web Service' and 'Android' in current build
  platforms: ['Backend', 'SFA Web Service', 'Android', 'Web Service', 'Integration', 'General', 'Testing'],

  projects: ['PRJ0008 - YSG Inventory', 'PRJ0021 - YSG Loyalty', 'YSGINV-P1 - YSG Inventory Project'],

  boundary: {
    descriptionMin:      'Test15CharsOnly',        // exactly 15 chars — minimum valid
    descriptionMin14:    '14charsonly!!!',           // exactly 14 chars — below minimum, should fail
    descriptionMax:      'A'.repeat(2000),           // exactly 2000 chars — maximum valid
    descriptionOver:     'A'.repeat(2001),           // 2001 chars — over limit (BUG-CT-001: currently accepted)
    descriptionEmpty:    '',
    pageNameLong:        'A'.repeat(300),
    descriptionSpecial:  'Test ticket with special chars: !@#$%^&*()_+-=[]{}|;:<>?',
  },

  security: {
    sqlInjection:   "' OR 1=1 --; DROP TABLE tickets; SELECT * FROM users;",
    xssPayload:     "<script>alert('xss')</script>",
    htmlInjection:  '<img src=x onerror=alert(1)>',
    xssPageName:    "<script>alert('xss')</script>",
  },

  fileUpload: {
    validImageFile: 'C:\\Users\\Turbosoft PC\\OneDrive\\Pictures\\Screenshots 1\\Screenshot 2026-06-26 091258.png',
    invalidFile:    'C:\\Users\\Turbosoft PC\\OneDrive\\Pictures\\Screenshots 1\\ViewAllTicket_20260621.xlsx',
  },

};
