const path = require('path');

function scanProject(projectPath) {
  // empty
}

function init(context) {
  // empty
}

function onInitSuccessful(context) {
  // empty
}

function configure(context) {
  // empty
}

function publish(context) {
  // empty
}

function run(context) {
  // empty
}

async function createFrontendConfigs(context, amplifyResources, amplifyCloudResources) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  // createAmplifyConfig(context, outputsByCategory);
  return await createAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
}

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

async function createAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend) {
  // to be implemented
}

module.exports = {
  scanProject,
  init,
  onInitSuccessful,
  configure,
  run,
  publish,
  createFrontendConfigs,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
