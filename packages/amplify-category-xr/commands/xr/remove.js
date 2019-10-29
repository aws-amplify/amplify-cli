const subcommand = 'remove';
const xrManager = require('../../lib/xr-manager');

module.exports = {
  name: subcommand,
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    xrManager.remove(context);
  },
};
