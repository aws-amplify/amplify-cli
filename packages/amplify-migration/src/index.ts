#!/usr/bin/env node
import path from 'node:path';

import { Gen2RenderingOptions, createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { resolveAppId } from '@aws-amplify/amplify-provider-awscloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';
import { BackendDownloader } from './backend_downloader.js';
import { AppContextLogger } from './logger.js';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';
import { Analytics, AppAnalytics } from './analytics.js';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher.js';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher.js';
import { $TSContext, AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';
import { DataDefinitionFetcher } from './data_definition_fetcher.js';
import { AmplifyStackParser } from './amplify_stack_parser.js';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: AppContextLogger;
  outputDirectory: string;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
}

export type AuthCliInputs = Record<string, unknown>;

const generateGen2Code = async ({
  logger,
  analytics,
  outputDirectory,
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
}: CodegenCommandParameters) => {
  logger.log(`Getting info for Amplify app`);

  logger.log('Getting latest environment info');

  const gen2RenderOptions: Readonly<Gen2RenderingOptions> = {
    outputDir: outputDirectory,
    auth: await authDefinitionFetcher.getDefinition(),
    storage: await storageDefinitionFetcher.getDefinition(),
    data: await dataDefinitionFetcher.getDefinition(),
  };

  const pipeline = createGen2Renderer(gen2RenderOptions);
  try {
    await pipeline.render();
    await analytics.logEvent('finishedMigration');
  } catch (e) {
    await analytics.logEvent('failedMigration');
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
  return path.join('amplify', 'backend', 'function', functionName, 'src');
};

const getAuthTriggersConnections = async (context: $TSContext): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
  const resourceName = Object.keys(amplifyMeta.auth)[0];
  const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
  if ('cognitoConfig' in authInputs && 'authTriggerConnections' in authInputs.cognitoConfig) {
    try {
      const triggerConnections: AuthTriggerConnection[] = JSON.parse(authInputs.cognitoConfig.authTriggerConnections);
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

  const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
  const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, amplifyClient);

  await generateGen2Code({
    outputDirectory: './output',
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client), s3Client),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(cognitoIdentityProviderClient, amplifyStackParser, backendEnvironmentResolver, () =>
      getAuthTriggersConnections(context),
    ),
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, amplifyStackParser),
    analytics: new AppAnalytics(appId),
    logger: new AppContextLogger(appId),
  });
}
