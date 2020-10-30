const attachBackendWorker = require('./attach-backend');
const initializer = require('./initializer');
const initializeEnv = require('./initialize-env');
const resourcePusher = require('./push-resources');
const envRemover = require('./delete-env');
const resourceBuilder = require('./build-resources');
const providerUtils = require('./utility-functions');
const constants = require('./constants');
const configManager = require('./configuration-manager');
const setupNewUser = require('./setup-new-user');
const { displayHelpfulURLs } = require('./display-helpful-urls');
const aws = require('./aws-utils/aws');
const pinpoint = require('./aws-utils/aws-pinpoint');
const { getLexRegionMapping } = require('./aws-utils/aws-lex');
const amplifyService = require('./aws-utils/aws-amplify');
const consoleCommand = require('./console');
const { loadResourceParameters, saveResourceParameters } = require('./resourceParams');
const { formUserAgentParam } = require('./aws-utils/user-agent');
const predictionsRegionMap = require('./aws-predictions-regions');

import { CognitoUserPoolService, createCognitoUserPoolService } from './aws-utils/CognitoUserPoolService';
import { IdentityPoolService, createIdentityPoolService } from './aws-utils/IdentityPoolService';

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
  action = action || ['missing'];
  const userAgentAction = `${category}:${action[0]}`;
  aws.config.update({
    customUserAgent: formUserAgentParam(context, userAgentAction),
  });
  return aws;
}

function getConfiguredPinpointClient(context, category, action, envName) {
  return pinpoint.getConfiguredPinpointClient(context, category, action, envName);
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

function openConsole(context) {
  return consoleCommand.run(context);
}

module.exports = {
  console: openConsole,
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
  getLexRegionMapping,
  getConfiguredPinpointClient,
  getConfiguredAmplifyClient,
  showHelpfulLinks,
  deleteEnv,
  loadResourceParameters,
  saveResourceParameters,
  predictionsRegionMap,
  ...require('./amplify-plugin-index'),
  CognitoUserPoolService,
  createCognitoUserPoolService,
  IdentityPoolService,
  createIdentityPoolService,
};
