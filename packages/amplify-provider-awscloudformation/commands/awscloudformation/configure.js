module.exports = {
  name: 'configure',
  run: async (context) => {
    const configManager = require('../../lib/configuration-manager');
    return configManager.configure(context);
  },
};
