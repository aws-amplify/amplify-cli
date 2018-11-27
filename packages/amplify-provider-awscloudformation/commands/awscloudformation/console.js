module.exports = {
  name: 'console',
  run: async context => {
    const consoleCommand = require('../../lib/console');
    return consoleCommand.run(context)
  },
};
