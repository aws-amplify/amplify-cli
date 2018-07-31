const initializer = require('./lib/initializer');
const configManager = require('./lib/configuration-manager');
const projectScanner = require('./lib/project-scanner');
const constants = require('./lib/constants');
const { createAWSConfig, createAmplifyConfig } = require('./lib/frontend-config-creator');

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
  createAWSConfig(context, outputsByProvider['awscloudformation']);
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
};
