const cliConstants = require('../extensions/amplify-helpers/constants');

module.exports = {
  name: cliConstants.CliName,
  run: async (context) => {
    const { showAllHelp } = require('../extensions/amplify-helpers/show-all-help');
    showAllHelp(context);
  },
};
