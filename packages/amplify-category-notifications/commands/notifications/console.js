module.exports = {
  name: 'console',
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    const pinpointHelper = require('../../lib/pinpoint-helper');
    await pinpointHelper.console(context);
  },
};
