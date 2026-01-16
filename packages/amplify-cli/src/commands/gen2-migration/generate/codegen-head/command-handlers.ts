#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { v4 as uuid } from 'uuid';

import { createGen2Renderer, Gen2RenderingOptions } from '../core/migration-pipeline';

import { UsageData } from '../../../../domain/amplify-usageData';
import { AmplifyClient, UpdateAppCommand, GetAppCommand, BackendEnvironment } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
//import { SSMClient } from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { BackendDownloader } from './backend_downloader';
import { AppContextLogger } from './logger';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { Analytics, AppAnalytics } from './analytics';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher';
import { AmplifyCategories, IUsageData, stateManager, pathManager, JSONUtilities, $TSMeta } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '../adapters/auth/index';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser } from './amplify_stack_parser';
import { AppFunctionsDefinitionFetcher } from './app_functions_definition_fetcher';
import { AuthAccessAnalyzer } from './auth_access_analyzer';
// import { TemplateGenerator, ResourceMapping } from '@aws-amplify/migrate-template-gen'; // Package not available
import { printer } from './printer';
import { format } from './format';
import ora from 'ora';
import { AppAnalyticsDefinitionFetcher } from './app_analytics_definition_fetcher';
import * as ts from 'typescript';
import { AmplifyHelperTransformer } from '../custom-resources/transformer/amplify-helper-transformer';
import { DependencyMerger } from '../custom-resources/generator/dependency-merger';
import { FileConverter } from '../custom-resources/generator/file-converter';
import { BackendUpdater } from '../custom-resources/generator/backend-updater';
import execa from 'execa';
import { Logger } from '../../../gen2-migration';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: Logger;
  outputDirectory: string;
  backendEnvironmentName: string | undefined;
  rootStackName: string | undefined;
  cloudFormationClient: CloudFormationClient;
  ccbFetcher: BackendDownloader;
  backendEnvironment: BackendEnvironment;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
  functionsDefinitionFetcher: AppFunctionsDefinitionFetcher;
  analyticsDefinitionFetcher: AppAnalyticsDefinitionFetcher;
}

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';
const GEN1_COMMAND = '- amplifyPush --simple';
const GEN2_INSTALL_COMMAND = '- npm ci --cache .npm --prefer-offline';
const GEN2_COMMAND = '- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';
const GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX = 'your Gen 2 backend code';
const GEN1_CUSTOM_RESOURCES_SUFFIX = 'your Gen 1 custom resources';
export const GEN1_CONFIGURATION_FILES = ['aws-exports.js', 'amplifyconfiguration.json', 'awsconfiguration.json'];
const CUSTOM_DIR = 'custom';
const TYPES_DIR = 'types';
const BACKEND_DIR = 'backend';
const GEN2_COMMAND_REPLACE_STRING = `${GEN2_INSTALL_COMMAND}\n${' '.repeat(8)}${GEN2_COMMAND}`;

enum GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS {
  DOT_AMPLIFY = '.amplify',
  AMPLIFY_OUTPUTS = 'amplify_outputs*',
  AMPLIFY_CONFIGURATION = 'amplifyconfiguration*',
  NODE_MODULES = 'node_modules',
  BUILD = 'build',
  DIST = 'dist',
}

const generateGen2Code = async ({
  outputDirectory,
  backendEnvironmentName,
  rootStackName,
  cloudFormationClient,
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
  functionsDefinitionFetcher,
  analyticsDefinitionFetcher,
  ccbFetcher,
  backendEnvironment,
  logger,
}: CodegenCommandParameters) => {
  logger.info('Fetching definitions from AWS for category: Auth');
  const auth = await authDefinitionFetcher.getDefinition();

  logger.info('Fetching definitions from AWS for category: Storage');
  const storage = await storageDefinitionFetcher.getDefinition();

  logger.info('Fetching definitions from AWS for category: Api');
  const data = await dataDefinitionFetcher.getDefinition();

  logger.info('Fetching definitions from AWS for category: Functions');
  const functions = await functionsDefinitionFetcher.getDefinition();

  logger.info('Fetching definitions from AWS for category: Analytics');
  const analytics = await analyticsDefinitionFetcher.getDefinition();

  logger.debug(`Auth: ${auth ? 'EXISTS' : 'UNDEFINED'}`);
  logger.debug(`Storage: ${storage ? 'EXISTS' : 'UNDEFINED'}`);
  logger.debug(`Data: ${data ? JSON.stringify(data, null, 2) : 'UNDEFINED'}`);
  logger.debug(`Functions: ${functions ? `${functions.length} functions` : 'UNDEFINED'}`);
  logger.debug(`Backend env: ${backendEnvironmentName}`);
  logger.debug(`Analytics: ${analytics ? JSON.stringify(analytics, null, 2) : 'UNDEFINED'}`);

  const gen2RenderOptions: Gen2RenderingOptions = {
    outputDir: outputDirectory,
    backendEnvironmentName: backendEnvironmentName,
    rootStackName: rootStackName,
    cfnClient: cloudFormationClient,
    auth,
    storage,
    data,
    functions,
    analytics,
    customResources: await getCustomResourceMap(ccbFetcher, backendEnvironment),
    unsupportedCategories: await unsupportedCategories(ccbFetcher, backendEnvironment),
  };

  assert(gen2RenderOptions);
  const pipeline = createGen2Renderer(gen2RenderOptions);
  assert(backendEnvironmentName);

  logger.info(`Generating ${GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX}`);
  await pipeline.render();
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
  return path.join(AMPLIFY_DIR, BACKEND_DIR, 'function', functionName, 'src');
};

const getUsageDataMetric = async (envName: string): Promise<IUsageData> => {
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
    {
      envName,
    },
    Date.now(),
  );

  return usageData;
};

const getAccountId = async (): Promise<string | undefined> => {
  const stsClient = new STSClient();
  const callerIdentityResult = await stsClient.send(new GetCallerIdentityCommand());
  return callerIdentityResult.Account;
};

export const getAuthTriggersConnections = async (
  ccbFetcher: BackendDownloader,
  backendEnvironment: BackendEnvironment,
): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const currentCloudBackendDirectory = await ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
  const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

  const amplifyMeta: AmplifyMeta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

  if (!amplifyMeta.auth) {
    return {};
  }
  const resourceName = Object.entries(amplifyMeta.auth).find(([, resource]) => resource.service === 'Cognito')?.[0];
  assert(resourceName);
  const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
  if (authInputs && typeof authInputs === 'object' && 'cognitoConfig' in authInputs && typeof authInputs.cognitoConfig === 'object') {
    let triggerConnections: AuthTriggerConnection[] = [];
    if ('authTriggerConnections' in authInputs.cognitoConfig) {
      try {
        // Check if authTriggerConnections is a valid JSON string
        if (typeof authInputs.cognitoConfig.authTriggerConnections === 'string') {
          triggerConnections = JSON.parse(authInputs.cognitoConfig.authTriggerConnections);
        } else {
          // If not a valid JSON string, assume it's an array of JSON strings
          triggerConnections = authInputs.cognitoConfig.authTriggerConnections.map((connection: string) => JSON.parse(connection));
        }
        return triggerConnections.reduce((prev, curr) => {
          prev[curr.triggerType] = getFunctionPath(curr.lambdaFunctionName);
          return prev;
        }, {} as Partial<Record<keyof LambdaConfigType, string>>);
      } catch (e) {
        throw new Error('Error parsing auth trigger connections');
      }
    } else if ('triggers' in authInputs.cognitoConfig && typeof authInputs.cognitoConfig.triggers === 'object') {
      const authTriggers = authInputs.cognitoConfig.triggers;
      return Object.keys(authTriggers).reduce((prev, authTrigger) => {
        const cognitoAuthTrigger = amplifyGen1InputsTriggerNameToCognitoTriggerName(authTrigger);
        prev[cognitoAuthTrigger] = getFunctionPath(`${resourceName}${authTrigger}`);
        return prev;
      }, {} as Partial<Record<keyof LambdaConfigType, string>>);
    }
  }
  return {};
};

/**
 *
 * @param triggerName The trigger name as registered in cli-inputs.json
 * @returns The corresponding trigger name as Cognito refers to it.
 */
function amplifyGen1InputsTriggerNameToCognitoTriggerName(triggerName: string): keyof LambdaConfigType {
  switch (triggerName) {
    case 'PreSignup':
      // notice the casing change
      return 'PreSignUp';
    default:
      // we don't know yet if this mapping needs to happen for other triggers
      // as we didn't test them yet. add here if we identify a new case.
      return triggerName as keyof LambdaConfigType;
  }
}

const unsupportedCategories = async (
  ccbFetcher: BackendDownloader,
  backendEnvironment: BackendEnvironment,
): Promise<Map<string, string>> => {
  const unsupportedCategories = new Map<string, string>();
  const urlPrefix = 'https://docs.amplify.aws/react/build-a-backend/add-aws-services';
  const restAPIKey = 'rest api';
  const analyticsKey = 'analytics';

  unsupportedCategories.set('geo', `${urlPrefix}/geo/`);
  unsupportedCategories.set('analytics', `${urlPrefix}/analytics/`);
  unsupportedCategories.set('predictions', `${urlPrefix}/predictions/`);
  unsupportedCategories.set('notifications', `${urlPrefix}/in-app-messaging/`);
  unsupportedCategories.set('interactions', `${urlPrefix}/interactions/`);
  unsupportedCategories.set(restAPIKey, `${urlPrefix}/rest-api/`);

  const currentCloudBackendDirectory = await ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
  const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

  const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

  const categories = Object.keys(meta);

  const unsupportedCategoriesList = new Map<string, string>();

  categories.forEach((category) => {
    if (category === 'analytics') {
      const analytics = meta?.analytics ?? {};
      Object.keys(analytics).forEach((analytic) => {
        const analyticObj = analytics[analytic];
        if (analyticObj.service === 'Pinpoint') {
          const analyticsDocLink = unsupportedCategories.get(analyticsKey);
          assert(analyticsDocLink);
          unsupportedCategoriesList.set(`Pinpoint ${analyticsKey}`, analyticsDocLink);
        }
      });
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

export async function updateAmplifyYmlFile(amplifyClient: AmplifyClient, appId: string) {
  const rootDir = pathManager.findProjectRoot();
  assert(rootDir);
  const amplifyYmlPath = path.join(rootDir, 'amplify.yml');

  try {
    // Read the content of amplify.yml file if it exists
    const amplifyYmlContent = await fs.readFile(amplifyYmlPath, 'utf-8');

    await writeToAmplifyYmlFile(amplifyYmlPath, amplifyYmlContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If amplify.yml file doesn't exist, make a getApp call to get buildSpec
      const getAppResponse = await amplifyClient.send(new GetAppCommand({ appId }));

      assert(getAppResponse.app, 'App not found');
      const buildSpec = getAppResponse.app.buildSpec;

      if (buildSpec) {
        await writeToAmplifyYmlFile(amplifyYmlPath, buildSpec);
      }
    } else {
      // Throw the original error if it's not related to file not found
      throw error;
    }
  }
}

async function writeToAmplifyYmlFile(amplifyYmlPath: string, content: string) {
  // eslint-disable-next-line spellcheck/spell-checker
  // Replace 'amplifyPush --simple' with 'npx ampx pipeline-deploy'
  content = content.replace(new RegExp(GEN1_COMMAND, 'g'), GEN2_COMMAND_REPLACE_STRING);
  await fs.writeFile(amplifyYmlPath, content, { encoding: 'utf-8' });
}

export async function updateGitIgnoreForGen2() {
  const cwd = process.cwd();
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
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.BUILD)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.BUILD}`;
  }
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DIST)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DIST}`;
  }
  // remove empty lines
  newGitIgnore = newGitIgnore.replace(/^\s*[\r\n]/gm, '');
  await fs.writeFile(`${cwd}/.gitignore`, newGitIgnore, { encoding: 'utf-8' });
}

const getCustomResources = async (ccbFetcher: BackendDownloader, backendEnvironment: BackendEnvironment): Promise<string[]> => {
  const currentCloudBackendDirectory = await ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
  const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

  const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });

  const customCategory = meta?.custom;

  // If the custom category exists, return its resource names; otherwise, return an empty array
  return customCategory ? Object.keys(customCategory) : [];
};

const getCustomResourceMap = async (
  ccbFetcher: BackendDownloader,
  backendEnvironment: BackendEnvironment,
): Promise<Map<string, string>> => {
  const customResources = await getCustomResources(ccbFetcher, backendEnvironment);
  const customResourceMap = new Map<string, string>();

  const rootDir = pathManager.findProjectRoot();
  assert(rootDir);
  const amplifyGen1BackendDir = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR);
  const sourceCustomResourcePath = path.join(amplifyGen1BackendDir, CUSTOM_DIR);

  for (const resource of customResources) {
    const cdkStackFilePath = path.join(sourceCustomResourcePath, resource, 'cdk-stack.ts');
    const cdkStackContent = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
    const className = cdkStackContent.match(/export class (\w+)/)?.[1];
    if (className) {
      customResourceMap.set(resource, className);
    }
  }

  return customResourceMap;
};

export async function updateCustomResources(ccbFetcher: BackendDownloader, backendEnvironment: BackendEnvironment) {
  const customResources = await getCustomResources(ccbFetcher, backendEnvironment);
  if (customResources.length > 0) {
    const movingGen1CustomResources = ora(`Moving ${GEN1_CUSTOM_RESOURCES_SUFFIX}`).start();
    const rootDir = pathManager.findProjectRoot();
    assert(rootDir);
    const amplifyGen1BackendDir = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR);
    const amplifyGen2Dir = path.join(TEMP_GEN_2_OUTPUT_DIR, AMPLIFY_DIR);
    const sourceCustomResourcePath = path.join(amplifyGen1BackendDir, CUSTOM_DIR);
    const destinationCustomResourcePath = path.join(amplifyGen2Dir, CUSTOM_DIR);
    const filterFiles = ['package.json', 'yarn.lock'];
    await fs.mkdir(destinationCustomResourcePath, { recursive: true });
    // Copy the custom resources, excluding package.json and yarn.lock files
    await fs.cp(sourceCustomResourcePath, destinationCustomResourcePath, {
      recursive: true,
      filter: (src) => {
        const fileName = path.basename(src);
        return !filterFiles.includes(fileName);
      },
    });

    const sourceTypesPath = path.join(amplifyGen1BackendDir, TYPES_DIR);
    const destinationTypesPath = path.join(amplifyGen2Dir, TYPES_DIR);
    await fs.mkdir(destinationTypesPath, { recursive: true });
    await fs.cp(sourceTypesPath, destinationTypesPath, { recursive: true });

    await updateCdkStackFile(customResources, destinationCustomResourcePath, rootDir);

    // Merge dependencies from custom resources into Gen2 package.json
    const gen2PackageJsonPath = path.join(amplifyGen2Dir, '..', 'package.json');
    const dependencyMerger = new DependencyMerger();
    await dependencyMerger.mergeDependencies(sourceCustomResourcePath, gen2PackageJsonPath);

    // Convert cdk-stack.ts to resource.ts
    const fileConverter = new FileConverter();
    await fileConverter.convertCdkStackToResource(destinationCustomResourcePath);

    // Remove build artifacts
    await fileConverter.removeBuildArtifacts(destinationCustomResourcePath);

    // Update backend.ts to register custom resources
    const backendFilePath = path.join(amplifyGen2Dir, 'backend.ts');
    const customResourceMap = await getCustomResourceMap(ccbFetcher, backendEnvironment);
    const backendUpdater = new BackendUpdater();
    await backendUpdater.updateBackendFile(backendFilePath, customResourceMap);

    movingGen1CustomResources.succeed(`Moved ${GEN1_CUSTOM_RESOURCES_SUFFIX}`);
  }
}

export async function updateCdkStackFile(customResources: string[], destinationCustomResourcePath: string, rootDir: string) {
  // Read project name from project-config.json
  let projectName: string | undefined;
  try {
    const projectConfigPath = path.join(rootDir, AMPLIFY_DIR, '.config', 'project-config.json');
    const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, { encoding: 'utf-8' }));
    projectName = projectConfig.projectName;
  } catch (e) {
    // If we can't read project name, continue without it
  }

  for (const resource of customResources) {
    const cdkStackFilePath = path.join(destinationCustomResourcePath, resource, 'cdk-stack.ts');

    try {
      let cdkStackContent = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });

      // Check for existence of AmplifyHelpers.addResourceDependency and throw an error if found
      if (hasUncommentedDependency(cdkStackContent, 'AmplifyHelpers.addResourceDependency')) {
        cdkStackContent = cdkStackContent.replace(
          /export class/,
          `throw new Error('Follow https://docs.amplify.aws/react/start/migrate-to-gen2/ to update the resource dependency');\n\nexport class`,
        );
      }

      // Add Construct import after other imports if not present
      if (!cdkStackContent.includes("from 'constructs'")) {
        const importRegex = /(import.*from.*['"]; ?\s*\n)/g;
        let lastImportMatch;
        let match;

        while ((match = importRegex.exec(cdkStackContent)) !== null) {
          lastImportMatch = match;
        }

        if (lastImportMatch) {
          const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
          cdkStackContent =
            cdkStackContent.slice(0, insertIndex) + "import { Construct } from 'constructs';\n" + cdkStackContent.slice(insertIndex);
        } else {
          // No imports found, add at the beginning
          cdkStackContent = "import { Construct } from 'constructs';\n" + cdkStackContent;
        }
      }

      // Replace the cdk.CfnParameter definition to include the default property
      cdkStackContent = cdkStackContent.replace(
        /new cdk\.CfnParameter\(this, ['"]env['"], {[\s\S]*?}\);/,
        `new cdk.CfnParameter(this, "env", {
                type: "String",
                description: "Current Amplify CLI env name",
                default: \`\${branchName}\`
              });`,
      );

      // Apply AmplifyHelperTransformer for AST-based transformations
      const sourceFile = ts.createSourceFile(cdkStackFilePath, cdkStackContent, ts.ScriptTarget.Latest, true);
      const transformedFile = AmplifyHelperTransformer.transform(sourceFile, projectName);
      const transformedWithBranchName = AmplifyHelperTransformer.addBranchNameVariable(transformedFile, projectName);
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      cdkStackContent = printer.printFile(transformedWithBranchName);

      await fs.writeFile(cdkStackFilePath, cdkStackContent, { encoding: 'utf-8' });
    } catch (error) {
      throw new Error(`Error updating the custom resource ${resource}`, { cause: error });
    }
  }
}

const hasUncommentedDependency = (fileContent: string, matchString: string) => {
  // Split the content into lines
  const lines = fileContent.split('\n');

  // Check each line
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if the line contains the dependency and is not commented
    if (
      trimmedLine.includes(matchString) &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('/*') &&
      !trimmedLine.includes('*/') &&
      !trimmedLine.match(/^\s*\*/)
    ) {
      return true;
    }
  }

  return false;
};
export async function prepare(logger: Logger, appId: string, envName: string, region: string) {
  const amplifyClient = new AmplifyClient();
  const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, envName, amplifyClient);
  const backendEnvironment = await backendEnvironmentResolver.selectBackendEnvironment();
  assert(backendEnvironment);
  assert(backendEnvironmentResolver);
  assert(backendEnvironment.environmentName);

  const s3Client = new S3Client();
  const cloudFormationClient = new CloudFormationClient();
  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
  const cognitoIdentityPoolClient = new CognitoIdentityClient();
  const lambdaClient = new LambdaClient({ region });
  const cloudWatchEventsClient = new CloudWatchEventsClient();
  const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
  const ccbFetcher = new BackendDownloader(s3Client);

  const authAnalyzer = new AuthAccessAnalyzer(backendEnvironmentResolver, ccbFetcher);

  await generateGen2Code({
    outputDirectory: TEMP_GEN_2_OUTPUT_DIR,
    storageDefinitionFetcher: new AppStorageDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client), s3Client),
    authDefinitionFetcher: new AppAuthDefinitionFetcher(
      cognitoIdentityPoolClient,
      cognitoIdentityProviderClient,
      amplifyStackParser,
      backendEnvironmentResolver,
      () => getAuthTriggersConnections(ccbFetcher, backendEnvironment),
      ccbFetcher,
    ),
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client)),
    functionsDefinitionFetcher: new AppFunctionsDefinitionFetcher(
      lambdaClient,
      cloudWatchEventsClient,
      backendEnvironmentResolver,
      stateManager,
      ccbFetcher,
      authAnalyzer,
    ),
    analyticsDefinitionFetcher: new AppAnalyticsDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client)),
    analytics: new AppAnalytics(appId),
    logger: logger,
    ccbFetcher,
    backendEnvironment,
    backendEnvironmentName: backendEnvironment.environmentName,
    rootStackName: backendEnvironment.stackName,
    cloudFormationClient: cloudFormationClient,
  });

  logger.info(`Creating 'amplify.yml' file for amplify hosting deployments`);
  await updateAmplifyYmlFile(amplifyClient, appId);

  logger.info('Updating .gitignore');
  await updateGitIgnoreForGen2();

  await updateCustomResources(ccbFetcher, backendEnvironment);

  const cwd = process.cwd();
  logger.info(`Overriding local 'amplify' folder`);
  await fs.rm(AMPLIFY_DIR, { recursive: true });
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });

  // hard reset on the dependencies. its not clear yet why a single `npm install` isn't
  // enough. empirecally we've seen many cases where such a hard reset resolves strange dependency conflicts.
  // TODO figure this out.
  logger.info('Deleting package-lock.json');
  await fs.rm(path.join(cwd, 'package-lock.json'), { recursive: true });

  logger.info('Deleting node_modules');
  await fs.rm(path.join(cwd, 'node_modules'), { recursive: true });

  logger.info('Installing dependencies');

  // again weird dependency issues - it takes two times to sync it up fully.
  await execa('npm', ['install']);
  await execa('npm', ['install']);
}
