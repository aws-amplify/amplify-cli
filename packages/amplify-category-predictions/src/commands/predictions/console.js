const subcommand = 'console';
const indexModule = require('../../index');

module.exports = {
  name: subcommand,
  run: async (context) => {
    await indexModule.console(context);
  },
};
