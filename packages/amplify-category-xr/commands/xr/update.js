const subcommand = 'update';
const xrManager = require('../../lib/xr-manager')

module.exports = {
  name: subcommand,
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    xrManager.configure(context);
  },
};
