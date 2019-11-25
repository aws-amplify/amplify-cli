const attachBackendWorker = require('./lib/attach-backend');
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
const amplifyService = require('./src/aws-utils/aws-amplify');
const consoleCommand = require('./lib/console');
const { loadResourceParameters, saveResourceParameters } = require('./src/resourceParams');
const { formUserAgentParam } = require('./src/aws-utils/user-agent');
const predictionsRegionMap = require('./lib/aws-predictions-regions');

function init(context) {
  return initializer.run(context);
}

function initEnv(context, providerMetadata) {
  return initializeEnv.run(context, providerMetadata);
}

async function attachBackend(context) {
  await attachBackendWorker.run(context);
}

// TODO: Change fn name to afterInit or onInitSuccess

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, resourceList) {
  return resourcePusher.run(context, resourceList);
}

function storeCurrentCloudBackend(context) {
  return resourcePusher.storeCurrentCloudBackend(context);
}

function deleteEnv(context, envName, deleteS3) {
  return envRemover.run(context, envName, deleteS3);
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

function getConfiguredPinpointClient(context, category, action, options = {}) {
  return pinpoint.getConfiguredPinpointClient(context, category, action, options);
}

function getPinpointRegionMapping() {
  return pinpoint.getPinpointRegionMapping();
}

function getConfiguredAmplifyClient(context, category, action, options = {}) {
  return amplifyService.getConfiguredAmplifyClient(context, category, action, options);
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
  attachBackend,
  init,
  initEnv,
  onInitSuccessful,
  configure,
  configureNewUser,
  constants,
  pushResources,
  storeCurrentCloudBackend,
  buildResources,
  providerUtils,
  setupNewUser,
  getConfiguredAWSClient,
  getPinpointRegionMapping,
  getConfiguredPinpointClient,
  getConfiguredAmplifyClient,
  showHelpfulLinks,
  deleteEnv,
  loadResourceParameters,
  saveResourceParameters,
  predictionsRegionMap,
  ...require('./amplify-plugin-index'),
};
