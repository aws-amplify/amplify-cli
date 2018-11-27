const constants = require('./lib/constants');

function scanProject(projectPath) {
  return require('./lib/project-scanner').run(projectPath);
}

function init(context) {
  return require('./lib/initializer').run(context);
}

function onInitSuccessful(context) {
  return require('./lib/initializer').onInitSuccessful(context);
}

function createFrontendConfigs(context, amplifyResources) {
  const { outputsForFrontend } = amplifyResources;
  const { createAWSConfig } = require('./lib/frontend-config-creator');
  // createAmplifyConfig(context, outputsByCategory);
  return createAWSConfig(context, outputsForFrontend);
}

function configure(context) {
  return require('./lib/configuration-manager').configure(context);
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
