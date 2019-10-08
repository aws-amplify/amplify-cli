const setupNewUser = require('../../lib/setup-new-user');

module.exports = {
  name: 'setupNewUser',
  alias: ['setup-new-user', 'newUser', 'new-user'],
  run: async context => {
    setupNewUser.run(context);
  },
};
