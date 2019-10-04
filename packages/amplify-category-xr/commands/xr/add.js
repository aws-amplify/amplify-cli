const subcommand = 'add';
const xrManager = require('../../lib/xr-manager');

module.exports = {
  name: subcommand,
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    xrManager.addScene(context);
  },
};
