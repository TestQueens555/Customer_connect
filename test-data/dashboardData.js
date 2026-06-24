module.exports = {
  validUser:   { username: 'sajith_xyz', password: 'User@123' },
  dateRanges: {
    valid:   { from: '2026-06-01', to: '2026-06-24' },
    invalid: { from: '2026-06-24', to: '2026-06-01' },  // To < From
    future:  { from: '2026-07-01', to: '2026-07-31' },
  },
  expectedStatCards:  ['TOTAL TICKETS', 'OPEN TICKETS', 'RESOLVED TICKETS', 'CRITICAL ISSUES'],
  expectedTableCols:  ['Project', 'Summary', 'Status'],
  expectedNavLinks: {
    createTicket:  '/Ticket/Create',
    actionQueue:   '/Tickets/ActionQueue',
    viewTickets:   '/Ticket/Index',
    summaryReport: '/Report/CustomerSupport',
  },
  searchTerm: 'test',
};
