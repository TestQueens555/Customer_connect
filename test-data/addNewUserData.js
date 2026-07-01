// test-data/addNewUserData.js
// Test data for Add New User (Admin/Partners) module
// AVAILABLE_CUSTOMERS confirmed from live page: [{id:3,name:"YSG"},{id:15,name:"YSG Inventory"}]

'use strict';
module.exports = {
  roles: { partnerAdmin: 'Partner Admin', partnerUser: 'Partner User' },
  customers: ['YSG', 'YSG Inventory'],
  validPartnerAdmin: { firstName: 'QA Admin', lastName: 'Auto', role: 'Partner Admin' },
  validPartnerUser:  { firstName: 'QA User',  lastName: 'Auto', role: 'Partner User',  customers: ['YSG'] },
  manualPassword:    { password: 'Test@12345', minLength: 8 },
  boundary: { firstNameMin: 'A', usernameMax: 'a'.repeat(50), invalidEmail: 'notanemail', invalidEmailAt: 'user@' },
  security: { sql: "' OR 1=1 --", xss: "<script>alert('xss')</script>", htmlInject: '<img src=x onerror=alert(1)>' },
  existingUsers: { username: 'qa_fc_off_269341', email: 'qa.fc.off.269341@digitsrtm.com' },
  tsUser: (prefix) => {
    const ts = Date.now().toString().slice(-6);
    return { firstName: `QA ${prefix}`, username: `qa_${prefix.toLowerCase()}_${ts}`, email: `qa.${prefix.toLowerCase()}.${ts}@digitsrtm.com` };
  },
};
