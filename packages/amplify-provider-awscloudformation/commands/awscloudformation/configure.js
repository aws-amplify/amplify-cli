const configManager = require('../../lib/configuration-manager');

module.exports = {
  name: 'configure',
  run: async context => configManager.configure(context),
};
