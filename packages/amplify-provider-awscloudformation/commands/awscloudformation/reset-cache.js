const configManager = require('../../lib/configuration-manager');

module.exports = {
  name: 'resetCache',
  alias: ['reset-cache'],
  run: async context => {
    await configManager.resetCache(context);
  },
};
