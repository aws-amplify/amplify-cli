const pinpointHelper = require('./lib/pinpoint-helper');
const {
  migrate,
} = require('./provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough');

function console(context) {
  pinpointHelper.console(context);
}

module.exports = {
  console,
  migrate,
};
