const pinpointHelper = require('./lib/pinpoint-helper');

async function console(context) {
  await pinpointHelper.console(context);
}

async function deletePinpointApp(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  await pinpointHelper.deletePinpointApp(context);
}

module.exports = {
  console,
  deletePinpointApp,
};

