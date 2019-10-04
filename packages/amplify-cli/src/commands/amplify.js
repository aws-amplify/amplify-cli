const cliConstants = require('../extensions/amplify-helpers/constants');
const { showAllHelp } = require('../extensions/amplify-helpers/show-all-help');

module.exports = {
  name: cliConstants.CliName,
  run: async context => {
    showAllHelp(context);
  },
};
