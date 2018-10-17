const xrManager = require('../../lib/xr-manager');

module.exports = {
    name: 'console',
    run: async (context) => {
        return xrManager.console(context); 
    },
  };
  