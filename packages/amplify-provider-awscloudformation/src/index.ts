const attachBackendWorker = require('./attach-backend');
const initializer = require('./initializer');
const initializeEnv = require('./initialize-env');
const resourcePusher = require('./push-resources');
const envRemover = require('./delete-env');
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

import { adminLoginFlow } from './admin-login';
import { adminBackendMap, isAmplifyAdminApp } from './utils/admin-helpers';
import { CognitoUserPoolService, createCognitoUserPoolService } from './aws-utils/CognitoUserPoolService';
import { IdentityPoolService, createIdentityPoolService } from './aws-utils/IdentityPoolService';
import { S3Service, createS3Service } from './aws-utils/S3Service';
import { DynamoDBService, createDynamoDBService } from './aws-utils/DynamoDBService';
import { resolveAppId } from './utils/resolve-appId';
import { loadConfigurationForEnv } from './configuration-manager';
import { getLocationSupportedRegion, getLocationRegionMapping } from './aws-utils/aws-location';
import { SSM } from './aws-utils/aws-ssm';
import { Lambda } from './aws-utils/aws-lambda';
import CloudFormation from './aws-utils/aws-cfn';
import { $TSContext } from 'amplify-cli-core';
import * as resourceExport from './export-resources';
import * as exportUpdateMeta from './export-update-amplify-meta';

export { resolveAppId } from './utils/resolve-appId';
export { loadConfigurationForEnv } from './configuration-manager';
export { getLocationSupportedRegion, getLocationRegionMapping } from './aws-utils/aws-location';
import { updateEnv } from './update-env';

import { uploadHooksDirectory } from './utils/hooks-manager';
import { getTransformerVersion } from './transform-graphql-schema';

export const cfnRootStackFileName = 'root-cloudformation-stack.json';
export { storeRootStackTemplate } from './initializer';
import { transformResourceWithOverrides } from './override-manager';
export { transformResourceWithOverrides } from './override-manager';
import { rootStackFileName } from './push-resources';
export { rootStackFileName } from './push-resources';

import { compileSchema } from './utility-functions';

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

function exportResources(context, resourceList, exportType) {
  return resourceExport.run(context, resourceList, exportType);
}

function exportedStackResourcesUpdateMeta(context: $TSContext, stackName: string) {
  return exportUpdateMeta.run(context, stackName);
}

function pushResources(context, resourceList, rebuild: boolean) {
  return resourcePusher.run(context, resourceList, rebuild);
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
  return amplifyService.getConfiguredAmplifyClient(context, options);
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

export async function getConfiguredSSMClient(context) {
  return await SSM.getInstance(context);
}

async function getLambdaSdk(context: $TSContext) {
  return await new Lambda(context);
}

async function getCloudFormationSdk(context: $TSContext) {
  return await new CloudFormation(context);
}

module.exports = {
  adminBackendMap,
  adminLoginFlow,
  console: openConsole,
  attachBackend,
  exportResources,
  exportedStackResourcesUpdateMeta,
  init,
  initEnv,
  isAmplifyAdminApp,
  getCloudFormationSdk,
  getLambdaSdk,
  onInitSuccessful,
  configure,
  configureNewUser,
  constants,
  pushResources,
  storeCurrentCloudBackend,
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
  S3Service,
  createS3Service,
  DynamoDBService,
  createDynamoDBService,
  resolveAppId,
  loadConfigurationForEnv,
  getConfiguredSSMClient,
  updateEnv,
  uploadHooksDirectory,
  getLocationSupportedRegion,
  getLocationRegionMapping,
  getTransformerVersion,
  transformResourceWithOverrides,
  rootStackFileName,
  compileSchema,
};
