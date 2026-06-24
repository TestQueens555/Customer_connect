module.exports = {
  validUser:    { username: 'sajith_xyz', password: 'User@123' },
  invalidUser:  { username: 'wrong_user', password: 'WrongPass@999' },
  emptyUser:    { username: '',           password: '' },
  boundaryData: {
    longUsername:   'a'.repeat(256),
    sqlInjection:   "' OR 1=1 --",
    xssPayload:     '<script>alert(\'xss\')</script>',
    specialChars:   '!@#$%^&*()',
    whitespaceOnly: '   ',
  },
};
