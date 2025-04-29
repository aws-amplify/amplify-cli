#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { v4 as uuid } from 'uuid';

import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

import { UsageData } from '@aws-amplify/cli-internal';
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import { SSMClient } from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { BackendDownloader } from './backend_downloader';
import { AppContextLogger } from './logger';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { Analytics, AppAnalytics } from './analytics';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher';
import { AppStorageDefinitionFetcher } from './app_storage_definition_fetcher';
import { AmplifyCategories, IUsageData, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser } from './amplify_stack_parser';
import { AppFunctionsDefinitionFetcher } from './app_functions_definition_fetcher';
import { TemplateGenerator, ResourceMapping } from '@aws-amplify/migrate-template-gen';
import { printer } from './printer';
import { format } from './format';
import ora from 'ora';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: AppContextLogger;
  outputDirectory: string;
  backendEnvironmentName: string | undefined;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
  functionsDefinitionFetcher: AppFunctionsDefinitionFetcher;
}

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';
const MIGRATION_DIR = '.amplify/migration';
const GEN1_COMMAND = '- amplifyPush --simple';
const GEN2_INSTALL_COMMAND = '- npm ci --cache .npm --prefer-offline';
const GEN2_COMMAND = '- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';
const GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX = 'your Gen 2 backend code';
const GEN1_REMOVE_CONFIGURATION_MESSAGE_SUFFIX = 'your Gen 1 configuration files';
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
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
  functionsDefinitionFetcher,
}: CodegenCommandParameters) => {
  const fetchingAWSResourceDetails = ora('Fetching resource details from AWS').start();
  const gen2RenderOptions = {
    outputDir: outputDirectory,
    backendEnvironmentName: backendEnvironmentName,
    auth: await authDefinitionFetcher.getDefinition(),
    storage: await storageDefinitionFetcher.getDefinition(),
    data: await dataDefinitionFetcher.getDefinition(),
    functions: await functionsDefinitionFetcher.getDefinition(),
    customResources: await getCustomResourceMap(),
    unsupportedCategories: unsupportedCategories(),
  };
  fetchingAWSResourceDetails.succeed('Fetched resource details from AWS');

  const gen2Codegen = ora(`Generating ${GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX}`).start();
  assert(gen2RenderOptions);
  const pipeline = createGen2Renderer(gen2RenderOptions);
  assert(backendEnvironmentName);
  const usageData = await getUsageDataMetric(backendEnvironmentName);

  try {
    await pipeline.render();
    await usageData.emitSuccess();
  } catch (e) {
    await usageData.emitError(e);
    gen2Codegen.fail(`Failed to generate ${GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX}`);
    throw e;
  }
  gen2Codegen.succeed(`Generated ${GEN2_COMMAND_GENERATION_MESSAGE_SUFFIX}`);
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

export const getAuthTriggersConnections = async (): Promise<Partial<Record<keyof LambdaConfigType, string>>> => {
  const amplifyMeta: AmplifyMeta = stateManager.getMeta();
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
        const triggerResourceName = `${resourceName}${authTrigger}`;
        prev[authTrigger as keyof LambdaConfigType] = getFunctionPath(triggerResourceName);
        return prev;
      }, {} as Partial<Record<keyof LambdaConfigType, string>>);
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
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.BUILD)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.BUILD}`;
  }
  if (!newGitIgnore.includes(GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DIST)) {
    newGitIgnore = `${newGitIgnore}\n${GEN2_AMPLIFY_GITIGNORE_FILES_OR_DIRS.DIST}`;
  }
  // remove empty lines
  newGitIgnore = newGitIgnore.replace(/^\s*[\r\n]/gm, '');
  await fs.writeFile(`${cwd}/.gitignore`, newGitIgnore, { encoding: 'utf-8' });
  updateGitIgnore.succeed('Updated gitignore contents');
}

const getCustomResources = (): string[] => {
  const meta = stateManager.getMeta();
  const customCategory = meta?.custom;

  // If the custom category exists, return its resource names; otherwise, return an empty array
  return customCategory ? Object.keys(customCategory) : [];
};

const getCustomResourceMap = async (): Promise<Map<string, string>> => {
  const customResources = getCustomResources();
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

export async function updateCustomResources() {
  const customResources = getCustomResources();
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
    movingGen1CustomResources.succeed(`Moved ${GEN1_CUSTOM_RESOURCES_SUFFIX}`);
  }
}

export async function updateCdkStackFile(customResources: string[], destinationCustomResourcePath: string, rootDir: string) {
  const projectInfo = await getProjectInfo(rootDir);

  for (const resource of customResources) {
    const cdkStackFilePath = path.join(destinationCustomResourcePath, resource, 'cdk-stack.ts');

    const amplifyHelpersImport = /import\s+\*\s+as\s+AmplifyHelpers\s+from\s+['"]@aws-amplify\/cli-extensibility-helper['"];\n?/;

    try {
      let cdkStackContent = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });

      // Check for existence of AmplifyHelpers.addResourceDependency and throw an error if found
      if (hasUncommentedDependency(cdkStackContent, 'AmplifyHelpers.addResourceDependency')) {
        cdkStackContent = cdkStackContent.replace(
          /export class/,
          `throw new Error('Follow https://docs.amplify.aws/react/start/migrate-to-gen2/ to update the resource dependency');\n\nexport class`,
        );
      }

      cdkStackContent = cdkStackContent.replace(
        /export class/,
        `const AMPLIFY_GEN_1_ENV_NAME = process.env.AMPLIFY_GEN_1_ENV_NAME ?? "sandbox";\n\nexport class`,
      );

      cdkStackContent = cdkStackContent.replace(/extends cdk.Stack/, `extends cdk.NestedStack`);

      // Replace the cdk.CfnParameter definition to include the default property
      cdkStackContent = cdkStackContent.replace(
        /new cdk\.CfnParameter\(this, ['"]env['"], {[\s\S]*?}\);/,
        `new cdk.CfnParameter(this, "env", {
                type: "String",
                description: "Current Amplify CLI env name",
                default: \`\${AMPLIFY_GEN_1_ENV_NAME}\`
              });`,
      );

      // Replace AmplifyHelpers.getProjectInfo() with {envName: 'envName', projectName: 'projectName'}
      cdkStackContent = cdkStackContent.replace(/AmplifyHelpers\.getProjectInfo\(\)/g, projectInfo);

      // Replace AmplifyHelpers.AmplifyResourceProps with {category: 'custom', resourceName: resource}
      cdkStackContent = cdkStackContent.replace(
        /AmplifyHelpers\.AmplifyResourceProps/g,
        `{category: 'custom', resourceName: '${resource}' }`,
      );

      // Remove the import statement for AmplifyHelpers
      cdkStackContent = cdkStackContent.replace(amplifyHelpersImport, '');

      await fs.writeFile(cdkStackFilePath, cdkStackContent, { encoding: 'utf-8' });
    } catch (error) {
      throw error(`Error updating the custom resource ${resource}`);
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

export async function getProjectInfo(rootDir: string) {
  const configDir = path.join(rootDir, AMPLIFY_DIR, '.config');
  const projectConfigFilePath = path.join(configDir, 'project-config.json');
  const projectConfig = await fs.readFile(projectConfigFilePath, { encoding: 'utf-8' });

  const projectConfigJson = JSON.parse(projectConfig);
  if (!projectConfigJson.projectName) {
    throw new Error('Project name not found in project-config.json');
  }

  return `{envName: \`\${AMPLIFY_GEN_1_ENV_NAME}\`, projectName: '${projectConfigJson.projectName}'}`;
}

export async function prepare() {
  const appId = resolveAppId();
  const inspectApp = ora(`Inspecting Amplify app ${appId} with current backend`).start();
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
  const cloudWatchEventsClient = new CloudWatchEventsClient();
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
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client), amplifyStackParser),
    functionsDefinitionFetcher: new AppFunctionsDefinitionFetcher(
      lambdaClient,
      cloudWatchEventsClient,
      backendEnvironmentResolver,
      stateManager,
    ),
    analytics: new AppAnalytics(appId),
    logger: new AppContextLogger(appId),
    backendEnvironmentName: backendEnvironment?.environmentName,
  });

  await updateAmplifyYmlFile(amplifyClient, appId);

  await updateGitIgnoreForGen2();

  await removeGen1ConfigurationFiles();

  await updateCustomResources();

  const movingGen1BackendFiles = ora(`Moving your Gen 1 backend files to ${format.highlight(MIGRATION_DIR)}`).start();
  // Move gen1 amplify to .amplify/migrations and move gen2 amplify from amplify-gen2 to amplify dir to convert current app to gen2.
  const cwd = process.cwd();
  await fs.rm(MIGRATION_DIR, { force: true, recursive: true });
  await fs.mkdir(MIGRATION_DIR, { recursive: true });
  await fs.rename(AMPLIFY_DIR, `${MIGRATION_DIR}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });
  movingGen1BackendFiles.succeed(`Moved your Gen 1 backend files to ${format.highlight(MIGRATION_DIR)}`);
}

export async function removeGen1ConfigurationFiles() {
  const removingGen1ConfigurationFiles = ora(`Removing ${GEN1_REMOVE_CONFIGURATION_MESSAGE_SUFFIX}`).start();
  try {
    const projectConfig = JSON.parse(await fs.readFile(`${AMPLIFY_DIR}/.config/project-config.json`, { encoding: 'utf-8' }));
    if ('frontend' in projectConfig && typeof projectConfig.frontend === 'string') {
      const frontendFramework = projectConfig.frontend;
      const frontendFrameworkKey = projectConfig[frontendFramework];
      if (
        frontendFramework in projectConfig &&
        'config' in frontendFrameworkKey &&
        typeof frontendFrameworkKey.config === 'object' &&
        'SourceDir' in frontendFrameworkKey.config &&
        typeof frontendFrameworkKey.config.SourceDir === 'string'
      ) {
        const sourceDirLocation = frontendFrameworkKey.config.SourceDir;
        await Promise.all(GEN1_CONFIGURATION_FILES.map((file) => fs.rm(`${sourceDirLocation}/${file}`)));
      }
    }
  } catch (e) {
    // Swallow errors from not being able to locate or read config files as its not in the core migration path
  } finally {
    removingGen1ConfigurationFiles.succeed(`Removed ${GEN1_REMOVE_CONFIGURATION_MESSAGE_SUFFIX}`);
  }
}
/**
 * Executes the stack refactor operation to move Gen1 resources from Gen1 stack into Gen2 stack
 * @param fromStack
 * @param toStack
 * @param resourceMappings
 */
export async function executeStackRefactor(fromStack: string, toStack: string, resourceMappings?: ResourceMapping[]) {
  const [templateGenerator, envName] = await initializeTemplateGenerator(fromStack, toStack);
  const success = await templateGenerator.generate(resourceMappings);
  const usageData = await getUsageDataMetric(envName);
  if (success) {
    printer.print(format.success(`Generated .README file(s) successfully under ${MIGRATION_DIR}/templates directory.`));
    await usageData.emitSuccess();
  } else {
    await usageData.emitError(new Error('Failed to run execute command'));
  }
}

export async function revertGen2Migration(fromStack: string, toStack: string) {
  const [templateGenerator, envName] = await initializeTemplateGenerator(fromStack, toStack);
  const success = await templateGenerator.revert();
  const usageData = await getUsageDataMetric(envName);
  if (success) {
    printer.print(format.success(`Moved resources back to Gen 1 stack successfully.`));
    const movingGen1BackendFiles = ora(`Moving your Gen 1 backend files to ${format.highlight(AMPLIFY_DIR)}`).start();
    // Move gen1 amplify from .amplify/migration/amplify to amplify
    await fs.rm(AMPLIFY_DIR, { force: true, recursive: true });
    await fs.rename(`${MIGRATION_DIR}/amplify`, AMPLIFY_DIR);
    movingGen1BackendFiles.succeed(`Moved your Gen 1 backend files to ${format.highlight(AMPLIFY_DIR)}`);
    await usageData.emitSuccess();
  } else {
    await usageData.emitError(new Error('Failed to run revert command'));
  }
}

async function initializeTemplateGenerator(fromStack: string, toStack: string) {
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
  const cfnClient = new CloudFormationClient();
  const ssmClient = new SSMClient();
  const cognitoIdpClient = new CognitoIdentityProviderClient();

  return [
    new TemplateGenerator(fromStack, toStack, accountId, cfnClient, ssmClient, cognitoIdpClient, appId, backendEnvironmentName),
    backendEnvironmentName,
  ];
}
