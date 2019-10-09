const path = require('path');
const pinpointHelper = require('./lib/pinpoint-helper');
const multiEnvManager = require('./lib/multi-env-manager');

const category = 'notifications';

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

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  console,
  deletePinpointAppForEnv,
  initEnv,
  migrate,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
