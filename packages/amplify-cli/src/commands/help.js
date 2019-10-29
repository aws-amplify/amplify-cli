const cliConstants = require('../extensions/amplify-helpers/constants');
const { showAllHelp } = require('../extensions/amplify-helpers/show-all-help');

module.exports = {
  name: cliConstants.CliName,
  alias: ['h', '-h'],
  run: async context => {
    await showAllHelp(context);
  },
};
