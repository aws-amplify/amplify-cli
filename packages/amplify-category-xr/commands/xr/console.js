const index = require('../../index')

module.exports = {
    name: 'console',
    run: async (context) => {
        return index.console(context);
    },
  };
  