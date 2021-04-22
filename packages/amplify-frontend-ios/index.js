const path = require('path');
const amplifyApp = require('amplify-app');
const { FeatureFlags } = require('amplify-cli-core');
const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const constants = require('./lib/constants');
const { createAmplifyConfig, createAWSConfig, deleteAmplifyConfig } = require('./lib/frontend-config-creator');

const pluginName = 'ios';

function scanProject(projectPath) {
  return projectScanner.run(projectPath);
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function displayFrontendDefaults(context, projectPath) {
  return configManager.displayFrontendDefaults(context);
}

function setFrontendDefaults(context, projectPath) {
  return configManager.setFrontendDefaults(context);
}

function createFrontendConfigs(context, amplifyResources, amplifyCloudResources) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  createAmplifyConfig(context, newOutputsForFrontend, cloudOutputsForFrontend);
  return createAWSConfig(context, newOutputsForFrontend, cloudOutputsForFrontend);
}
function configure(context) {
  return configManager.configure(context);
}

function publish(context) {
  return context;
}

function run(context) {
  return context;
}

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, pluginName);
  } else {
    commandPath = path.join(commandPath, pluginName, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

const postEvents = new Set(['PostInit', 'PostCodegenModels', 'PostPull']);

async function handleAmplifyEvent(context, args) {
  const { frontend } = context.amplify.getProjectConfig();
  const isXcodeIntegrationEnabled = FeatureFlags.getBoolean('frontend-ios.enableXcodeIntegration');
  const isFrontendiOS = frontend === 'ios';
  if (isFrontendiOS && isXcodeIntegrationEnabled && postEvents.has(args.event)) {
    await amplifyApp.run({
      skipEnvCheck: true,
      platform: frontend,
      skipInit: true,
      internalOnlyIosCallback: true,
    });
  }
}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  displayFrontendDefaults,
  setFrontendDefaults,
  configure,
  publish,
  run,
  createFrontendConfigs,
  executeAmplifyCommand,
  handleAmplifyEvent,
  deleteConfig: deleteAmplifyConfig,
};
