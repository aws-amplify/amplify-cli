#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';

import { Gen2RenderingOptions, createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { BackendDownloader } from './backend_downloader';
import { AppContextLogger } from './logger';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { Analytics, AppAnalytics } from './analytics';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher';
import { AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser } from './amplify_stack_parser';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: AppContextLogger;
  outputDirectory: string;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
}

export type AuthCliInputs = Record<string, unknown>;

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';
const MIGRATION_DIR = '.amplify/migration';

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

const getFunctionPath = (functionName: string) => {
  return path.join('amplify', 'backend', 'function', functionName, 'src');
};

const getAuthTriggersConnections = async (): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
  const resourceName = Object.keys(amplifyMeta.auth)[0];
  const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
  if ('cognitoConfig' in authInputs && 'authTriggerConnections' in authInputs.cognitoConfig) {
    try {
      const triggerConnections: AuthTriggerConnection[] = JSON.parse(authInputs.cognitoConfig.authTriggerConnections);
      const connections = triggerConnections.reduce((prev, curr) => {
        prev[curr.triggerType] = getFunctionPath(curr.lambdaFunctionName);
        return prev;
      }, {} as Partial<Record<keyof LambdaConfigType, string>>);
      return connections;
    } catch (e) {
      throw new Error('Error parsing auth trigger connections');
    }
  }
  return {};
};

const resolveAppId = (): string => {
  const meta = stateManager.getMeta();
  return meta?.providers?.awscloudformation?.AmplifyAppId;
};

export async function execute() {
  const amplifyClient = new AmplifyClient();
  const s3Client = new S3Client();
  const cloudFormationClient = new CloudFormationClient();
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
  const cognitoIdentityPoolClient = new CognitoIdentityClient();
  const appId = resolveAppId();

  const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
  const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, amplifyClient);

  await generateGen2Code({
    outputDirectory: TEMP_GEN_2_OUTPUT_DIR,
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client), s3Client),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(
      cognitoIdentityPoolClient,
      cognitoIdentityProviderClient,
      amplifyStackParser,
      backendEnvironmentResolver,
      () => getAuthTriggersConnections(),
    ),
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, amplifyStackParser),
    analytics: new AppAnalytics(appId),
    logger: new AppContextLogger(appId),
  });

  // Move gen1 amplify to .amplify/migrations and move gen2 amplify from amplify-gen2 to amplify dir to convert current app to gen2.
  const cwd = process.cwd();
  await fs.mkdir(MIGRATION_DIR, { recursive: true });
  await fs.rename(AMPLIFY_DIR, `${MIGRATION_DIR}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });
}
