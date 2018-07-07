const configurationManager = require('../lib/configuration-manager');

module.exports = {
  name: 'configure',
  run: async (context) => {
    configurationManager.configure(context); 
  },
};



