const index = require('../../index');

module.exports = {
  name: 'console',
  run: async context => index.console(context),
};
