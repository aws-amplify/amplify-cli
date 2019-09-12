const initializer = require('./lib/initializer');
const initializeEnv = require('./lib/initialize-env');
const resourcePusher = require('./lib/push-resources');
const envRemover = require('./lib/delete-env');
const resourceBuilder = require('./lib/build-resources');
const providerUtils = require('./lib/utility-functions');
const constants = require('./lib/constants');
const configManager = require('./lib/configuration-manager');
const setupNewUser = require('./lib/setup-new-user');
const { displayHelpfulURLs } = require('./lib/display-helpful-urls');
const aws = require('./src/aws-utils/aws');
const pinpoint = require('./src/aws-utils/aws-pinpoint');
const consoleCommand = require('./lib/console');
const { loadResourceParameters, saveResourceParameters } = require('./src/resourceParams');
const { formUserAgentParam } = require('./src/aws-utils/user-agent');

function init(context) {
  return initializer.run(context);
}

function initEnv(context, providerMetadata) {
  return initializeEnv.run(context, providerMetadata);
}

// TODO: Change fn name to afterInit or onInitSuccess

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, resourceList) {
  return resourcePusher.run(context, resourceList);
}

function deleteEnv(context, envName) {
  return envRemover.run(context, envName);
}

function configure(context) {
  return configManager.configure(context);
}

function buildResources(context, category, resourceName) {
  return resourceBuilder.run(context, category, resourceName);
}

async function getConfiguredAWSClient(context, category, action) {
  await aws.configureWithCreds(context);
  category = category || 'missing';
  action = action || 'missing';
  const userAgentAction = `${category}:${action[0]}`;
  aws.config.update({
    customUserAgent: formUserAgentParam(context, userAgentAction),
  });
  return aws;
}

function getConfiguredPinpointClient(context) {
  return pinpoint.getConfiguredPinpointClient(context);
}

function getPinpointRegionMapping(context) {
  return pinpoint.getPinpointRegionMapping(context);
}

function showHelpfulLinks(context, resources) {
  return displayHelpfulURLs(context, resources);
}

function configureNewUser(context) {
  return setupNewUser.run(context);
}

function console(context) {
  return consoleCommand.run(context);
}

module.exports = {
  console,
  init,
  initEnv,
  onInitSuccessful,
  configure,
  configureNewUser,
  constants,
  pushResources,
  buildResources,
  providerUtils,
  setupNewUser,
  getConfiguredAWSClient,
  getPinpointRegionMapping,
  getConfiguredPinpointClient,
  showHelpfulLinks,
  deleteEnv,
  loadResourceParameters,
  saveResourceParameters,
  ...require('./amplify-plugin-index'),
};
