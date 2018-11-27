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
  // createAmplifyConfig(context, outputsByCategory);
  const { createAWSExports } = require('./lib/frontend-config-creator');
  return createAWSExports(context, outputsForFrontend);
}

function configure(context) {
  return require('./lib/configuration-manager').configure(context);
}

function publish(context) {
  return require('./lib/publisher').run(context);
}

function run(context) {
  return require('./lib/server').run(context);
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
