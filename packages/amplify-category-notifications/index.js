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

async function initEnvPush(context) {
  await multiEnvManager.initEnvPush(context);
}

async function migrate(context) {
  context.print.info('notifications migrate...');
}

module.exports = {
  console,
  deletePinpointAppForEnv,
  initEnv,
  initEnvPush,
  migrate,
};

