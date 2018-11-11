const pinpointHelper = require('./lib/pinpoint-helper');
const multiEnvManager = require('./lib/multi-env-manager');

async function console(context) {
  await pinpointHelper.console(context);
}

async function deletePinpointApp(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  await pinpointHelper.deletePinpointApp(context);
}

async function initEnv(context) {
  multiEnvManager.initEnv(context);
}

async function initEnvPush(context) {
  multiEnvManager.initEnvPush(context);
}

module.exports = {
  console,
  deletePinpointApp,
  initEnv,
  initEnvPush,
};

