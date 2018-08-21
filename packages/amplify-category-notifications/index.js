const pinpointHelper = require('./lib/pinpoint-helper');

async function console(context) {
  await pinpointHelper.console(context);
}

async function deletePinpointApp(context) {
  await pinpointHelper.deletePinpointApp(context);
}

module.exports = {
  console,
  deletePinpointApp,
};

