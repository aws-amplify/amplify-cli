#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { v4 as uuid } from 'uuid';

import { Gen2RenderingOptions, createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { UsageData, getProjectSettings } from '@aws-amplify/cli-internal';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SSMClient } from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { BackendDownloader } from './backend_downloader';
import { AppContextLogger } from './logger';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { Analytics, AppAnalytics } from './analytics';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher';
import { AmplifyCategories, IUsageData, stateManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser } from './amplify_stack_parser';
import { AppFunctionsDefinitionFetcher } from './app_functions_definition_fetcher';
import { TemplateGenerator } from '@aws-amplify/migrate-template-gen';
import { printer } from './printer';
import { format } from './format';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: AppContextLogger;
  outputDirectory: string;
  backendEnvironmentName: string | undefined;
  appId: string;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
  functionsDefinitionFetcher: AppFunctionsDefinitionFetcher;
}

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';
const MIGRATION_DIR = '.amplify/migration';

const generateGen2Code = async ({
  logger,
  analytics,
  outputDirectory,
  backendEnvironmentName,
  appId,
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
  functionsDefinitionFetcher,
}: CodegenCommandParameters) => {
  logger.log(`Getting info for Amplify app`);

  logger.log('Getting latest environment info');

  const gen2RenderOptions: Readonly<Gen2RenderingOptions> = {
    outputDir: outputDirectory,
    appId: appId,
    backendEnvironmentName: backendEnvironmentName,
    auth: await authDefinitionFetcher.getDefinition(),
    storage: await storageDefinitionFetcher.getDefinition(),
    data: await dataDefinitionFetcher.getDefinition(),
    functions: await functionsDefinitionFetcher.getDefinition(),
    unsupportedCategories: unsupportedCategories(),
  };

  const pipeline = createGen2Renderer(gen2RenderOptions);
  const usageData = await getUsageDataMetric();

  try {
    await pipeline.render();
    await analytics.logEvent('finishedCodegen');
    await usageData.emitSuccess();
  } catch (e) {
    await analytics.logEvent('failedCodegen');
    await usageData.emitError(e);
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

const getUsageDataMetric = async (): Promise<IUsageData> => {
  const usageData = UsageData.Instance;
  const accountId = await getAccountId();
  assert(accountId);

  usageData.init(
    uuid(),
    '',
    {
      command: 'to-gen-2',
      argv: process.argv,
    },
    accountId,
    getProjectSettings(),
    Date.now(),
  );

  return usageData;
};

const getAccountId = async (): Promise<string | undefined> => {
  const stsClient = new STSClient();
  const callerIdentityResult = await stsClient.send(new GetCallerIdentityCommand());
  const accountId = callerIdentityResult.Account;
  return accountId;
};

const getAuthTriggersConnections = async (): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
  const resourceName = Object.keys(amplifyMeta.auth)[0];
  const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
  if ('cognitoConfig' in authInputs && 'authTriggerConnections' in authInputs.cognitoConfig) {
    try {
      let triggerConnections: AuthTriggerConnection[];
      // Check if authTriggerConnections is a valid JSON string
      if (typeof authInputs.cognitoConfig.authTriggerConnections === 'string') {
        triggerConnections = JSON.parse(authInputs.cognitoConfig.authTriggerConnections);
      } else {
        // If not a valid JSON string, assume it's an array of JSON strings
        triggerConnections = authInputs.cognitoConfig.authTriggerConnections.map((connection: string) => JSON.parse(connection));
      }
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

const unsupportedCategories = (): Map<string, string> => {
  const unsupportedCategories = new Map<string, string>();
  const urlPrefix = 'https://docs.amplify.aws/react/build-a-backend/add-aws-services';

  unsupportedCategories.set('geo', `${urlPrefix}/geo/`);
  unsupportedCategories.set('analytics', `${urlPrefix}/analytics/`);
  unsupportedCategories.set('predictions', `${urlPrefix}/predictions/`);
  unsupportedCategories.set('notifications', `${urlPrefix}/in-app-messaging/`);
  unsupportedCategories.set('interactions', `${urlPrefix}/interactions/`);
  unsupportedCategories.set('custom', `${urlPrefix}/custom-resources/`);
  unsupportedCategories.set('rest api', `${urlPrefix}/rest-api/`);

  const meta = stateManager.getMeta();
  const categories = Object.keys(meta);

  const unsupportedCategoriesList = new Map<string, string>();

  categories.forEach((category) => {
    if (category == 'api') {
      const apiList = meta?.api;
      if (apiList) {
        Object.keys(apiList).forEach((api) => {
          const apiObj = apiList[api];
          if (apiObj.service == 'API Gateway') {
            unsupportedCategoriesList.set('rest api', unsupportedCategories.get('rest api')!);
          }
        });
      }
    } else {
      if (unsupportedCategories.has(category) && Object.entries(meta[category]).length > 0) {
        unsupportedCategoriesList.set(category, unsupportedCategories.get(category)!);
      }
    }
  });

  return unsupportedCategoriesList;
};

export async function execute() {
  const amplifyClient = new AmplifyClient();
  const s3Client = new S3Client();
  const cloudFormationClient = new CloudFormationClient();
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
  const cognitoIdentityPoolClient = new CognitoIdentityClient();
  const lambdaClient = new LambdaClient({
    region: stateManager.getCurrentRegion(),
  });
  const appId = resolveAppId();

  const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
  const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, amplifyClient);
  const backendEnvironment = await backendEnvironmentResolver.selectBackendEnvironment();
  const ccbFetcher = new BackendDownloader(s3Client);

  await generateGen2Code({
    outputDirectory: TEMP_GEN_2_OUTPUT_DIR,
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client), s3Client),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(
      cognitoIdentityPoolClient,
      cognitoIdentityProviderClient,
      amplifyStackParser,
      backendEnvironmentResolver,
      () => getAuthTriggersConnections(),
      ccbFetcher,
    ),
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, amplifyStackParser),
    functionsDefinitionFetcher: new AppFunctionsDefinitionFetcher(lambdaClient, backendEnvironmentResolver, stateManager),
    analytics: new AppAnalytics(appId),
    logger: new AppContextLogger(appId),
    backendEnvironmentName: backendEnvironment?.environmentName,
    appId: appId,
  });

  // Move gen1 amplify to .amplify/migrations and move gen2 amplify from amplify-gen2 to amplify dir to convert current app to gen2.
  const cwd = process.cwd();
  await fs.mkdir(MIGRATION_DIR, { recursive: true });
  await fs.rename(AMPLIFY_DIR, `${MIGRATION_DIR}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });
}

export async function generateTemplates(fromStack: string, toStack: string) {
  const cfnClient = new CloudFormationClient();
  const ssmClient = new SSMClient();
  const cognitoIdpClient = new CognitoIdentityProviderClient();
  const accountId = await getAccountId();
  assert(accountId);
  const gen1MetaFile = await fs.readFile(`${MIGRATION_DIR}/${AMPLIFY_DIR}/backend/amplify-meta.json`, { encoding: 'utf-8' });
  assert(gen1MetaFile);
  const gen1Meta = JSON.parse(gen1MetaFile);
  const { AmplifyAppId: appId, StackName: stackName } = gen1Meta.providers.awscloudformation;
  assert(appId);
  assert(stackName);
  const backendEnvironmentName = stackName.split('-')?.[2];
  assert(backendEnvironmentName);
  const templateGenerator = new TemplateGenerator(
    fromStack,
    toStack,
    accountId,
    cfnClient,
    ssmClient,
    cognitoIdpClient,
    appId,
    backendEnvironmentName,
  );
  await templateGenerator.generate();
  printer.print(
    format.success(
      `Generated CloudFormation templates and .README file(s) successfully under ${MIGRATION_DIR}/<category>/templates directory.`,
    ),
  );
}
