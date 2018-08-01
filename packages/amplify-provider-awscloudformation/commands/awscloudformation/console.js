const consoleCommand = require('../../lib/console');

module.exports = {
  name: 'console',
  run: async context => consoleCommand.run(context),
};
