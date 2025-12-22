#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { v4 as uuid } from 'uuid';

import { createGen2Renderer } from '../core/migration-pipeline';

import { UsageData } from '../../../../../domain/amplify-usageData';
import { AmplifyClient, UpdateAppCommand, GetAppCommand } from '@aws-sdk/client-amplify';
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
import { AmplifyCategories, IUsageData, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { AuthTriggerConnection } from '../adapters/auth/index';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser } from './amplify_stack_parser';
import { AppFunctionsDefinitionFetcher } from './app_functions_definition_fetcher';
// import { TemplateGenerator, ResourceMapping } from '@aws-amplify/migrate-template-gen'; // Package not available
import { printer } from './printer';
import { format } from './format';
import ora from 'ora';
import * as ts from 'typescript';
import { AmplifyHelperTransformer } from '../../../codegen-custom-resources/transformer/amplify-helper-transformer';
import { DependencyMerger } from '../../../codegen-custom-resources/generator/dependency-merger';
import { FileConverter } from '../../../codegen-custom-resources/generator/file-converter';
import { BackendUpdater } from '../../../codegen-custom-resources/generator/backend-updater';
import execa from 'execa';
import { Logger } from '../../../../gen2-migration';

interface CodegenCommandParameters {
  analytics: Analytics;
  logger: Logger;
  outputDirectory: string;
  backendEnvironmentName: string | undefined;
  dataDefinitionFetcher: DataDefinitionFetcher;
  authDefinitionFetcher: AppAuthDefinitionFetcher;
  storageDefinitionFetcher: AppStorageDefinitionFetcher;
  functionsDefinitionFetcher: AppFunctionsDefinitionFetcher;
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
  authDefinitionFetcher,
  dataDefinitionFetcher,
  storageDefinitionFetcher,
  functionsDefinitionFetcher,
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

  logger.debug(`Auth: ${auth ? 'EXISTS' : 'UNDEFINED'}`);
  logger.debug(`Storage: ${storage ? 'EXISTS' : 'UNDEFINED'}`);
  logger.debug(`Data: ${data ? JSON.stringify(data, null, 2) : 'UNDEFINED'}`);
  logger.debug(`Functions: ${functions ? `${functions.length} functions` : 'UNDEFINED'}`);
  logger.debug(`Backend env: ${backendEnvironmentName}`);

  const gen2RenderOptions = {
    outputDir: outputDirectory,
    backendEnvironmentName: backendEnvironmentName,
    auth,
    storage,
    data,
    functions,
    customResources: await getCustomResourceMap(),
    unsupportedCategories: unsupportedCategories(),
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

type CustomResourceServiceType = 'customCDK' | 'customCloudformation';

const getCustomResourcesWithType = (): Map<string, CustomResourceServiceType> => {
  const meta = stateManager.getMeta();
  const customCategory = meta?.custom;
  const resourceMap = new Map<string, CustomResourceServiceType>();

  if (customCategory) {
    Object.entries(customCategory).forEach(([name, config]: [string, { service: CustomResourceServiceType }]) => {
      resourceMap.set(name, config.service);
    });
  }
  return resourceMap;
};

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

    // For CloudFormation resources, rename template to template.json
    const resourcesWithType = getCustomResourcesWithType();
    for (const [resource, serviceType] of resourcesWithType) {
      if (serviceType === 'customCloudformation') {
        const srcTemplatePath = path.join(destinationCustomResourcePath, resource, `${resource}-cloudformation-template.json`);
        const destTemplatePath = path.join(destinationCustomResourcePath, resource, 'template.json');
        await fs.rename(srcTemplatePath, destTemplatePath);
      }
    }

    const sourceTypesPath = path.join(amplifyGen1BackendDir, TYPES_DIR);
    const destinationTypesPath = path.join(amplifyGen2Dir, TYPES_DIR);
    await fs.mkdir(destinationTypesPath, { recursive: true });
    await fs.cp(sourceTypesPath, destinationTypesPath, { recursive: true });

    // Extract dependencies BEFORE transformation (from source files)
    const resourceDependencies = await extractResourceDependencies(customResources, sourceCustomResourcePath);

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
    const customResourceMap = await getCustomResourceMap();
    const backendUpdater = new BackendUpdater();
    await backendUpdater.updateBackendFile(backendFilePath, customResourceMap, resourceDependencies);

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

      // AmplifyHelpers.addResourceDependency is now supported by the transformer

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

const extractResourceDependencies = async (
  customResources: string[],
  destinationCustomResourcePath: string,
): Promise<Map<string, string[]>> => {
  const resourceDependencies = new Map<string, string[]>();

  for (const resource of customResources) {
    const cdkStackFilePath = path.join(destinationCustomResourcePath, resource, 'cdk-stack.ts');

    try {
      const cdkStackContent = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
      const dependencies: string[] = [];

      // Parse for AmplifyHelpers.addResourceDependency calls
      const dependencyRegex = /AmplifyHelpers\.addResourceDependency\s*\([^,]+,[^,]+,[^,]+,\s*\[([^\]]+)\]/g;
      let match;

      while ((match = dependencyRegex.exec(cdkStackContent)) !== null) {
        const dependenciesArray = match[1];

        // Extract category values from dependency objects
        const categoryRegex = /category:\s*['"]([^'"]+)['"]/g;
        let categoryMatch;

        while ((categoryMatch = categoryRegex.exec(dependenciesArray)) !== null) {
          const category = categoryMatch[1];
          if (!dependencies.includes(category)) {
            dependencies.push(category);
          }
        }
      }

      if (dependencies.length > 0) {
        resourceDependencies.set(resource, dependencies);
      }
    } catch (error) {
      // If we can't read the file, skip dependency extraction for this resource
      console.warn(`Could not extract dependencies for resource ${resource}:`, error);
    }
  }

  return resourceDependencies;
};

export const extractCfnDependencies = async (templatePath: string): Promise<string[]> => {
  const template = JSON.parse(await fs.readFile(templatePath, { encoding: 'utf-8' }));
  const params = Object.keys(template.Parameters || {});
  const categoryPattern = /^(auth|storage|api|function)/;
  const categories = new Set<string>();

  params
    .filter((p) => p !== 'env')
    .forEach((param) => {
      const match = param.match(categoryPattern);
      if (match) categories.add(match[1]);
    });

  return Array.from(categories);
};

export async function prepare(logger: Logger) {
  const appId = resolveAppId();
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
    dataDefinitionFetcher: new DataDefinitionFetcher(backendEnvironmentResolver, new BackendDownloader(s3Client)),
    functionsDefinitionFetcher: new AppFunctionsDefinitionFetcher(
      lambdaClient,
      cloudWatchEventsClient,
      backendEnvironmentResolver,
      stateManager,
    ),
    analytics: new AppAnalytics(appId),
    logger: logger,
    backendEnvironmentName: backendEnvironment?.environmentName,
  });

  logger.info(`Creating 'amplify.yml' file for amplify hosting deployments`);
  await updateAmplifyYmlFile(amplifyClient, appId);

  logger.info('Updating .gitignore');
  await updateGitIgnoreForGen2();

  await updateCustomResources();

  const cwd = process.cwd();
  logger.info(`Overriding local 'amplify' folder`);
  await fs.rm(AMPLIFY_DIR, { recursive: true });
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });

  logger.info('Installing dependencies');

  // unclear why but it takes 2 installs to get the lock file in sync
  await execa('npm', ['install']);
  await execa('npm', ['install']);
}
