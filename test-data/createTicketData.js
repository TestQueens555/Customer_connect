// Create Ticket module — all test data in one place
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

  platforms: ['Backend', 'SFA Web Service', 'Android', 'Web Service', 'Integration', 'General', 'Testing'],

  projects: ['PRJ0008 - YSG Inventory', 'PRJ0021 - YSG Loyalty', 'YSGINV-P1 - YSG Inventory Project'],

  boundary: {
    descriptionMin:      'Exactly 15chars!',       // exactly 15 chars
    descriptionMin14:    '14charsonly!!!',           // exactly 14 chars — should fail
    descriptionMax:      'A'.repeat(2000),           // exactly 2000 chars
    descriptionOver:     'A'.repeat(2001),           // 2001 chars — over limit
    descriptionEmpty:    '',
    pageNameLong:        'A'.repeat(300),
    descriptionSpecial:  'Test ticket with special chars: !@#$%^&*()_+-=[]{}|;:<>?',
  },

  security: {
    sqlInjection:   "' OR 1=1 --; DROP TABLE tickets;",
    xssPayload:     '<script>alert("xss")</script>',
    htmlInjection:  '<img src=x onerror=alert(1)>',
  },

};
