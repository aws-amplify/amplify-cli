const consoleCommand = require('../../lib/console');

module.exports = {
  name: 'console',
  run: async (context) => {
    return consoleCommand.run(context);
  },
};
