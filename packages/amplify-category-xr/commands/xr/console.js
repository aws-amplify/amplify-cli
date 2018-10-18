const xrManager = require('../../lib/xr-manager');

module.exports = {
  name: 'console',
  run: async context => xrManager.console(context),
};
