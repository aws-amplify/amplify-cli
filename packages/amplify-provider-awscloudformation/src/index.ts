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
const { getLexRegionMapping } = require('./aws-utils/aws-lex');
const amplifyService = require('./aws-utils/aws-amplify');
const consoleCommand = require('./console');
const { loadResourceParameters, saveResourceParameters } = require('./resourceParams');
import { formUserAgentParam } from './aws-utils/user-agent';
export { formUserAgentParam } from './aws-utils/user-agent';
const predictionsRegionMap = require('./aws-predictions-regions');

import { adminLoginFlow } from './admin-login';
import { adminBackendMap, isAmplifyAdminApp } from './utils/admin-helpers';
import { CognitoUserPoolService, createCognitoUserPoolService } from './aws-utils/CognitoUserPoolService';
import { IdentityPoolService, createIdentityPoolService } from './aws-utils/IdentityPoolService';
import { S3Service, createS3Service } from './aws-utils/S3Service';
import { DynamoDBService, createDynamoDBService } from './aws-utils/DynamoDBService';
import { resolveAppId } from './utils/resolve-appId';
import { storeCurrentCloudBackend } from './utils/upload-current-cloud-backend';
import { loadConfigurationForEnv, loadConfiguration, resolveRegion } from './configuration-manager';
export { loadConfigurationForEnv, loadConfiguration, resolveRegion } from './configuration-manager';
import { getLocationSupportedRegion, getLocationRegionMapping } from './aws-utils/aws-location';
import { SSM } from './aws-utils/aws-ssm';
import { CognitoUserPoolClientProvider } from './aws-utils/aws-cognito-client';
import { Lambda } from './aws-utils/aws-lambda';
import CloudFormation from './aws-utils/aws-cfn';
import { $TSContext, ApiCategoryFacade } from '@aws-amplify/amplify-cli-core';
import * as resourceExport from './export-resources';
import * as exportUpdateMeta from './export-update-amplify-meta';

export { resolveAppId } from './utils/resolve-appId';
export { storeCurrentCloudBackend } from './utils/upload-current-cloud-backend';
export { getLocationSupportedRegion, getLocationRegionMapping } from './aws-utils/aws-location';
import { updateEnv } from './update-env';

export const cfnRootStackFileName = 'root-cloudformation-stack.json';
export { storeRootStackTemplate } from './initializer';
import { transformResourceWithOverrides } from './override-manager';
export { transformResourceWithOverrides } from './override-manager';
import { rootStackFileName } from './push-resources';
export { rootStackFileName } from './push-resources';

import { compileSchema } from './utility-functions';
import { LocationService } from './aws-utils/aws-location-service';
import { hashDirectory } from './upload-appsync-files';
import { prePushCfnTemplateModifier } from './pre-push-cfn-processor/pre-push-cfn-modifier';
import { getApiKeyConfig } from './utils/api-key-helpers';
import { deleteEnvironmentParametersFromService } from './utils/ssm-utils/delete-ssm-parameters';
export { deleteEnvironmentParametersFromService } from './utils/ssm-utils/delete-ssm-parameters';
import { getEnvParametersUploadHandler, getEnvParametersDownloadHandler } from './utils/ssm-utils/env-parameter-ssm-helpers';
import { proxyAgent } from './aws-utils/aws-globals';
export {
  getEnvParametersUploadHandler,
  getEnvParametersDownloadHandler,
  DownloadHandler,
  PrimitiveRecord,
} from './utils/ssm-utils/env-parameter-ssm-helpers';
export { AwsSdkConfig } from './utils/auth-types';

// Drift detection exports have been moved to amplify-cli package

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

function deleteEnv(context, envName, deleteS3) {
  return envRemover.run(context, envName, deleteS3);
}

function configure(context) {
  return configManager.configure(context);
}

async function getConfiguredAWSClientConfig(context, category, action) {
  const credsConfig = await loadConfiguration(context);
  category = category || 'missing';
  action = action || ['missing'];
  const userAgentAction = `${category}:${action[0]}`;
  const config = {
    credentials: credsConfig.credentials || credsConfig,
    customUserAgent: formUserAgentParam(context, userAgentAction),
    httpOptions: {
      agent: proxyAgent(),
    },
    region: credsConfig.region,
  };
  return config;
}

// TODO: get rid of this function after data Gen1 releases
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

function getConfiguredAmplifyClient(context, category, action, options = {}) {
  return amplifyService.getConfiguredAmplifyClient(context, options);
}

function showHelpfulLinks(context, resources) {
  return displayHelpfulURLs(context, resources);
}

function configureNewUser(context) {
  return setupNewUser.run(context);
}

async function openConsole(context) {
  return consoleCommand.run(context);
}

export async function getConfiguredSSMClient(context) {
  return await SSM.getInstance(context);
}

export async function getConfiguredCognitoIdentityProviderClient(context) {
  return await CognitoUserPoolClientProvider.getInstance(context);
}

export async function getConfiguredLocationServiceClient(context: $TSContext, options?: Record<string, unknown>) {
  return await LocationService.getInstance(context, options);
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
  getConfiguredAWSClientConfig,
  getLexRegionMapping,
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
  getConfiguredCognitoIdentityProviderClient,
  getConfiguredSSMClient,
  updateEnv,
  getLocationSupportedRegion,
  getLocationRegionMapping,
  // Keeping for backwards compatibility
  getTransformerVersion: ApiCategoryFacade.getTransformerVersion,
  transformResourceWithOverrides,
  rootStackFileName,
  compileSchema,
  getConfiguredLocationServiceClient,
  hashDirectory,
  prePushCfnTemplateModifier,
  getApiKeyConfig,
  getEnvParametersDownloadHandler,
  getEnvParametersUploadHandler,
  deleteEnvironmentParametersFromService,
  formUserAgentParam,
  loadConfiguration,
  resolveRegion,
};
