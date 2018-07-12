const initializer = require('./lib/initializer');
const projectScanner = require('./lib/project-scanner');
const configManager = require('./lib/configuration-manager');
const { createAWSExports, createAmplifyConfig } = require('./lib/frontend-config-creator');
const constants = require('./lib/constants');

function scanProject(projectPath) {
  return projectScanner.run(projectPath);
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function createFrontendConfigs(context, amplifyResources) {
  const { outputsByProvider, outputsByCategory } = amplifyResources;
  createAmplifyConfig(context, outputsByCategory);
  createAWSExports(context, outputsByProvider['amplify-provider-awscloudformation']);
}

function configure(context) {
  return configManager.configure(context);
}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  configure,
  createFrontendConfigs,
};
