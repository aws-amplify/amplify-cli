const pinpointHelper = require('../../lib/pinpoint-helper');

module.exports = {
    name: "console",
    run: async (context) => {
        await pinpointHelper.console(context);
    },
};
  