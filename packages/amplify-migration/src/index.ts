#!/usr/bin/env node
import path from 'node:path';

import { Gen2RenderingOptions, createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import { resolveAppId } from '@aws-amplify/amplify-provider-awscloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';
import { BackendDownloader } from './backend_downloader.js';
import { Logger } from './logger.js';
import { BackendEnvironmentSelector } from './backend_environment_selector.js';
import { Analytics, DummyAnalytics } from './analytics.js';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher.js';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher.js';
import { $TSContext, AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnections } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: Logger;
  appId: string;
  outputDirectory: string;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
  backendEnvironmentSelector: BackendEnvironmentSelector;
}

export type AuthCliInputs = Record<string, unknown>;

const generateGen2Code = async ({
  logger,
  analytics,
  appId,
  outputDirectory,
  authDefinitionFetcher,
  storageDefinitionFetcher,
  backendEnvironmentSelector,
}: CodegenCommandParameters) => {
  await analytics.logEvent('startMigration', {
    appId,
  });

  logger.log(`Getting info for Amplify app: ${appId}`);

  const backendEnvironment = await backendEnvironmentSelector.selectBackendEnvironment(appId);
  assert(backendEnvironment, 'A BackendEnvironment must be selected');
  assert(backendEnvironment?.deploymentArtifacts, 'The app must have a deployment bucket');
  assert(backendEnvironment?.stackName, 'BackendEnvironment stack name not found');
  logger.log(backendEnvironment?.stackName);

  logger.log('Getting latest environment info');

  const gen2RenderOptions: Readonly<Gen2RenderingOptions> = {
    outputDir: outputDirectory,
    auth: await authDefinitionFetcher.getDefinition(backendEnvironment.stackName),
    storage: await storageDefinitionFetcher.getDefinition(backendEnvironment.deploymentArtifacts),
  };

  const pipeline = createGen2Renderer(gen2RenderOptions);
  try {
    await pipeline.render();
    await analytics.logEvent('finishedMigration', { appId });
  } catch (e) {
    await analytics.logEvent('failedMigration', { appId });
  }
};

type AmplifyMetaAuth = {
  service: 'Cognito';
  providerPlugin: 'awscloudformation';
};

type AmplifyMeta = {
  auth: Record<string, AmplifyMetaAuth>;
};

const getFunctionPath = (context: $TSContext, functionName: string) => {
  //  const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
  return path.join('amplify', 'backend', 'function', functionName, 'src');
};

const getAuthTriggersConnections = async (context: $TSContext): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
  const resourceName = Object.keys(amplifyMeta.auth)[0];
  const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
  if ('cognitoConfig' in authInputs && 'authTriggerConnections' in authInputs.cognitoConfig) {
    try {
      const triggerConnections: AuthTriggerConnections[] = JSON.parse(authInputs.cognitoConfig.authTriggerConnections);
      const connections = triggerConnections.reduce((prev, curr) => {
        prev[curr.triggerType] = getFunctionPath(context, curr.lambdaFunctionName);
        return prev;
      }, {} as Partial<Record<keyof LambdaConfigType, string>>);
      return connections;
    } catch (e) {
      throw new Error('Error parsing auth trigger connections');
    }
  }
  return {};
};

export async function executeAmplifyCommand(context: $TSContext) {
  const amplifyClient = new AmplifyClient();
  const s3Client = new S3Client();
  const cloudFormationClient = new CloudFormationClient();
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
  const appId = resolveAppId(context);

  await generateGen2Code({
    outputDirectory: './output',
    appId,
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(new BackendDownloader(s3Client), s3Client),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(cognitoIdentityProviderClient, cloudFormationClient, () =>
      getAuthTriggersConnections(context),
    ),
    analytics: new DummyAnalytics(),
    logger: new Logger(),
    backendEnvironmentSelector: new BackendEnvironmentSelector(amplifyClient),
  });
}
