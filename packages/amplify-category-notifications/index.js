const pinpointHelper = require('./lib/pinpoint-helper');
const multiEnvManager = require('./lib/multi-env-manager');

async function console(context) {
  await pinpointHelper.console(context);
}

async function deletePinpointAppForEnv(context, envName) {
  await multiEnvManager.deletePinpointAppForEnv(context, envName);
}

async function initEnv(context) {
  await multiEnvManager.initEnv(context);
}

async function migrate(context) {
  await multiEnvManager.migrate(context);
}

module.exports = {
  console,
  deletePinpointAppForEnv,
  initEnv,
  migrate,
};

