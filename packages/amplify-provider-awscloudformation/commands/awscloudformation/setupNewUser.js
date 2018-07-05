const {setupNewUser} = require('../../lib/setup-new-user');

module.exports = {
  name: 'setupNewUser',
  run: async (context) => {
    setupNewUser(context);
  },
};
