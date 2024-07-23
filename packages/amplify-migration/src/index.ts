#!/usr/bin/env node
import { Gen2RenderingOptions, createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import assert from 'node:assert';
import { resolveAppId } from '@aws-amplify/amplify-provider-awscloudformation';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';
import { BackendDownloader } from './backend_downloader.js';
import { Logger } from './logger.js';
import { BackendEnvironmentSelector } from './backend_environment_selector.js';
import { Analytics, DummyAnalytics } from './analytics.js';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher.js';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher.js';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

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

  const gen2RenderOptions: Gen2RenderingOptions = {
    outputDir: outputDirectory,
  };

  gen2RenderOptions.auth = await authDefinitionFetcher.getDefinition(backendEnvironment.stackName);

  gen2RenderOptions.storage = await storageDefinitionFetcher.getDefinition(backendEnvironment.deploymentArtifacts);

  const pipeline = createGen2Renderer(gen2RenderOptions);
  try {
    await pipeline.render();
    await analytics.logEvent('finishedMigration', { appId });
  } catch (e) {
    await analytics.logEvent('failedMigration', { appId });
  }
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
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(new BackendDownloader(s3Client)),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(cognitoIdentityProviderClient, cloudFormationClient),
    analytics: new DummyAnalytics(),
    logger: new Logger(),
    backendEnvironmentSelector: new BackendEnvironmentSelector(amplifyClient),
  });
}
