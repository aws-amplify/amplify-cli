const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const constants = require('./lib/constants');
const { createAWSConfig } = require('./lib/frontend-config-creator');

function scanProject(projectPath) {
  return projectScanner.run(projectPath);
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function createFrontendConfigs(context, amplifyResources, amplifyCloudResources) {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  // createAmplifyConfig(context, outputsByCategory);
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

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  configure,
  publish,
  run,
  createFrontendConfigs,
  ...require('./amplify-plugin-index'),
};
