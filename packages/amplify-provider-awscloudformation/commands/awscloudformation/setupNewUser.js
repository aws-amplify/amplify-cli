module.exports = {
  name: 'setupNewUser',
  alias: ['setup-new-user', 'newUser', 'new-user'],
  run: async (context) => {
    const setupNewUser = require('../../lib/setup-new-user');
    setupNewUser.run(context);
  },
};
