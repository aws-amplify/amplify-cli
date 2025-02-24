#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { v4 as uuid } from 'uuid';

import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { getProjectSettings, UsageData } from '@aws-amplify/cli-internal';
import { AmplifyClient, UpdateAppCommand } from '@aws-sdk/client-amplify';
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
import ora from 'ora';

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

enum GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS {
  DOT_AMPLIFY = '.amplify',
  AMPLIFY_OUTPUTS = 'amplify_outputs*',
  AMPLIFY_CONFIGURATION = 'amplifyconfiguration*',
  NODE_MODULES = 'node_modules',
}

const generateGen2Code = async ({
  outputDirectory,
  backendEnvironmentName,
  appId,
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
  functionsDefinitionFetcher,
}: CodegenCommandParameters) => {
  const fetchingAWSResourceDetails = ora('Fetching resource details from AWS').start();
  const gen2RenderOptions = {
    outputDir: outputDirectory,
    appId: appId,
    backendEnvironmentName: backendEnvironmentName,
    auth: await authDefinitionFetcher.getDefinition(),
    storage: await storageDefinitionFetcher.getDefinition(),
    data: await dataDefinitionFetcher.getDefinition(),
    functions: await functionsDefinitionFetcher.getDefinition(),
    unsupportedCategories: unsupportedCategories(),
  };
  fetchingAWSResourceDetails.succeed('Fetched resource details from AWS');

  const gen2Codegen = ora('Generating your Gen 2 backend code').start();
  assert(gen2RenderOptions);
  const pipeline = createGen2Renderer(gen2RenderOptions);
  const usageData = await getUsageDataMetric();

  try {
    await pipeline.render();
    await usageData.emitSuccess();
  } catch (e) {
    await usageData.emitError(e);
  }
  gen2Codegen.succeed('Generated your Gen 2 backend code');
};

type AmplifyMetaAuth = {
  service: 'Cognito';
  providerPlugin: 'awscloudformation';
};

type AmplifyMetaFunction = {
  service: 'Lambda';
  providerPlugin: 'awscloudformation';
  output: Record<string, string>;
};

type AmplifyMeta = {
  auth: Record<string, AmplifyMetaAuth>;
  function: Record<string, AmplifyMetaFunction>;
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
  return callerIdentityResult.Account;
};

const getAuthTriggersConnections = async (): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
  const resourceName = Object.entries(amplifyMeta.auth).find(([, resource]) => resource.service === 'Cognito')?.[0];
  assert(resourceName);
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
  const restAPIKey = 'rest api';

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
            const restAPIDocsLink = unsupportedCategories.get(restAPIKey);
            assert(restAPIDocsLink);
            unsupportedCategoriesList.set(restAPIKey, restAPIDocsLink);
          }
        });
      }
    } else {
      if (unsupportedCategories.has(category) && Object.entries(meta[category]).length > 0) {
        const unsupportedCategoryDocLink = unsupportedCategories.get(category);
        assert(unsupportedCategoryDocLink);
        unsupportedCategoriesList.set(category, unsupportedCategoryDocLink);
      }
    }
  });

  return unsupportedCategoriesList;
};

async function updateGitIgnoreForGen2() {
  const cwd = process.cwd();
  const updateGitIgnore = ora('Updating gitignore contents').start();
  // Rewrite .gitignore to support gen2 related files
  let gitIgnore = '';
  try {
    gitIgnore = await fs.readFile(`${cwd}/.gitignore`, { encoding: 'utf-8' });
  } catch (e) {
    // ignore absence of gitignore
  }
  // remove gen 1 amplify section
  const regex = /#amplify-do-not-edit-begin[\s\S]*#amplify-do-not-edit-end/g;
  let newGitIgnore = gitIgnore.replace(regex, '');
  // add gen 2 section
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DOT_AMPLIFY)) {
    newGitIgnore = `${newGitIgnore}\n# amplify\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DOT_AMPLIFY}`;
  }
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.AMPLIFY_OUTPUTS)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.AMPLIFY_OUTPUTS}`;
  }
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.AMPLIFY_CONFIGURATION)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.AMPLIFY_CONFIGURATION}`;
  }
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.NODE_MODULES)) {
    newGitIgnore = `${newGitIgnore}\n# node_modules\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.NODE_MODULES}`;
  }
  // remove empty lines
  newGitIgnore = newGitIgnore.replace(/^\s*[\r\n]/gm, '');
  await fs.writeFile(`${cwd}/.gitignore`, newGitIgnore, { encoding: 'utf-8' });
  updateGitIgnore.succeed('Updated gitignore contents');
}

export async function execute() {
  const appId = resolveAppId();
  const inspectApp = await ora(`Inspecting Amplify app ${appId} with current backend`).start();
  const amplifyClient = new AmplifyClient();
  const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, amplifyClient);
  const backendEnvironment = await backendEnvironmentResolver.selectBackendEnvironment();
  assert(backendEnvironment);
  assert(backendEnvironmentResolver);
  assert(backendEnvironment.environmentName);

  const s3Client = new S3Client();
  const cloudFormationClient = new CloudFormationClient();
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
  const cognitoIdentityPoolClient = new CognitoIdentityClient();
  const lambdaClient = new LambdaClient({
    region: stateManager.getCurrentRegion(),
  });
  const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
  const ccbFetcher = new BackendDownloader(s3Client);
  inspectApp.stop();

  await amplifyClient.send(
    new UpdateAppCommand({
      appId,
      environmentVariables: {
        AMPLIFY_GEN_1_ENV_NAME: backendEnvironment.environmentName,
      },
    }),
  );

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

  await updateGitIgnoreForGen2();

  const movingGen1BackendFiles = ora(`Moving your Gen1 backend files to ${format.highlight(MIGRATION_DIR)}`).start();
  // Move gen1 amplify to .amplify/migrations and move gen2 amplify from amplify-gen2 to amplify dir to convert current app to gen2.
  const cwd = process.cwd();
  await fs.mkdir(MIGRATION_DIR, { recursive: true });
  await fs.rename(AMPLIFY_DIR, `${MIGRATION_DIR}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });
  movingGen1BackendFiles.succeed(`Moved your Gen1 backend files to ${format.highlight(MIGRATION_DIR)}`);
}

/**
 * Executes the stack refactor operation to move Gen1 resources from Gen1 stack into Gen2 stack
 * @param fromStack
 * @param toStack
 */
export async function executeStackRefactor(fromStack: string, toStack: string) {
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
  const usageData = await getUsageDataMetric();
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
  const success = await templateGenerator.generate();
  if (success) {
    printer.print(format.success(`Generated .README file(s) successfully under ${MIGRATION_DIR}/<category>/templates directory.`));
  }
  await usageData.emitSuccess();
}
