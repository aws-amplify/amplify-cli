const path = require('path');

function init(context) {}

function initEnv(context, providerMetadata) {}

function onInitSuccessful(context) {}

function pushResources(context, resourceList) {}

function deleteEnv(context, envName, deleteS3) {}

function configure(context) {}

async function executeAmplifyCommand(context) {
  const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
  const commandPath = path.join(commandsDirPath, context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
  const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${args.event}`);
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context, args);
}

module.exports = {
  init,
  onInitSuccessful,
  initEnv,
  deleteEnv,
  configure,
  pushResources,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
