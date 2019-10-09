const pinpointHelper = require('../../lib/pinpoint-helper');

module.exports = {
  name: 'console',
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    await pinpointHelper.console(context);
  },
};
