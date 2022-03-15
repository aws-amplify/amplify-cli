import { DeploymentResources, TransformerProjectConfig } from '@aws-amplify/graphql-transformer-core';
import {
  $TSAny,
  $TSContext, AmplifyCategories, JSONUtilities, pathManager, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { CloudFormation, Fn, Template } from 'cloudform';
import * as crc from 'crc';
import { Diff, diff as getDiffs } from 'deep-diff';
import fs from 'fs-extra';
import { ResourceConstants } from 'graphql-transformer-common';
import { find, pullAllBy } from 'lodash';
import * as path from 'path';
import rimraf from 'rimraf';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import { isAmplifyAdminApp } from '../utils/admin-helpers';

const ROOT_STACK_FILE_NAME = 'cloudformation-template.json';
const PARAMETERS_FILE_NAME = 'parameters.json';
const CUSTOM_ROLES_FILE_NAME = 'custom-roles.json';
const AMPLIFY_ADMIN_ROLE = '_Full-access/CognitoIdentityCredentials';
const AMPLIFY_MANAGE_ROLE = '_Manage-only/CognitoIdentityCredentials';

export interface CustomRolesConfig {
  adminRoleNames?: Array<string>;
}
export interface DiffableProject {
  stacks: {
    [stackName: string]: Template;
  };
  root: Template;
}

export type DiffChanges<T> = Array<Diff<T, T>>;

interface GqlDiff {
  diff: DiffChanges<DiffableProject>;
  next: DiffableProject;
  current: DiffableProject;
}

/**
 * returns auth resource IdentityPoolId
 */
export const getIdentityPoolId = async (ctx: $TSContext): Promise<string | undefined> => {
  const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('auth');
  const authResources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName');
  const authResource = find(authResources, { service: 'Cognito', providerPlugin: providerName }) as $TSAny;
  return authResource?.output?.IdentityPoolId;
};

/**
 * returns admin roles
 */
export const getAdminRoles = async (ctx: $TSContext, apiResourceName: string | undefined): Promise<Array<string>> => {
  let currentEnv;
  const adminRoles = new Array<string>();

  try {
    currentEnv = ctx.amplify.getEnvInfo().envName;
  } catch (err) {
    // When there is no environment info, return [] - This is required for sandbox pull
    return [];
  }

  // admin ui roles
  try {
    const amplifyMeta = stateManager.getMeta();
    const appId = amplifyMeta?.providers?.[providerName]?.AmplifyAppId;
    const res = await isAmplifyAdminApp(appId);
    if (res.userPoolID) {
      adminRoles.push(`${res.userPoolID}${AMPLIFY_ADMIN_ROLE}`, `${res.userPoolID}${AMPLIFY_MANAGE_ROLE}`);
    }
  } catch (err) {
    // no need to error if not admin ui app
  }

  // additional admin role checks
  if (apiResourceName) {
    // lambda functions which have access to the api
    const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('function');
    const resources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName')
      .filter((r: $TSAny) => r.dependsOn?.some((d: $TSAny) => d?.resourceName === apiResourceName))
      .map((r: $TSAny) => `${r.resourceName}-${currentEnv}`);
    adminRoles.push(...resources);

    // check for custom iam admin roles
    const customRoleFile = path.join(
      pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, apiResourceName),
      CUSTOM_ROLES_FILE_NAME,
    );
    if (fs.existsSync(customRoleFile)) {
      const customRoleConfig = JSONUtilities.readJson<CustomRolesConfig>(customRoleFile);
      if (customRoleConfig && customRoleConfig.adminRoleNames) {
        adminRoles.push(...customRoleConfig.adminRoleNames);
      }
    }
  }
  return adminRoles;
};

/**
 * return GQL diff
 */
export const getGQLDiff = (currentBackendDir: string, cloudBackendDir: string): GqlDiff => {
  const currentBuildDir = path.join(currentBackendDir, 'build');
  const cloudBuildDir = path.join(cloudBackendDir, 'build');
  if (fs.existsSync(cloudBuildDir) && fs.existsSync(currentBuildDir)) {
    const current = loadDiffableProject(cloudBuildDir, ROOT_STACK_FILE_NAME);
    const next = loadDiffableProject(currentBuildDir, ROOT_STACK_FILE_NAME);
    return { current, next, diff: getDiffs(current, next) };
  }
  return null;
};

/**
 * returns GQL updated resource
 */
export const getGqlUpdatedResource = (resources: $TSAny[]): $TSAny => resources.find(
  resource => resource?.service === 'AppSync' && resource?.providerMetadata?.logicalId && resource?.providerPlugin === 'awscloudformation',
) || null;

/**
 * load diffable project
 */
export const loadDiffableProject = (projectPath: string, rootStackName: string): DiffableProject => {
  const project = readFromPath(projectPath);
  const currentStacks = project.stacks || {};
  const diffableProject: DiffableProject = {
    stacks: {},
    root: {},
  };

  Object.keys(currentStacks).forEach(key => { diffableProject.stacks[key] = JSONUtilities.parse(project.stacks[key]); });

  if (project[rootStackName]) {
    diffableProject.root = JSONUtilities.parse(project[rootStackName]);
  }
  return diffableProject;
};

/**
 * read project from directory
 */
const readFromPath = (directory: string): $TSAny => {
  const pathExists = fs.pathExistsSync(directory);
  if (!pathExists) {
    return {};
  }
  const dirStats = fs.lstatSync(directory);
  if (!dirStats.isDirectory()) {
    const buf = fs.readFileSync(directory);
    return buf.toString();
  }
  const files = fs.readdirSync(directory);
  const accum = {};

  files.forEach(fileName => {
    const fullPath = path.join(directory, fileName);
    const value = readFromPath(fullPath);
    accum[fileName] = value;
  });

  return accum;
};

/**
 * merge user configuration with transform output
 */
export const mergeUserConfigWithTransformOutput = (
  userConfig: TransformerProjectConfig,
  transformOutput: DeploymentResources,
  opts?: $TSAny,
): DeploymentResources => {
  const userFunctions = userConfig.functions || {};
  const userResolvers = userConfig.resolvers || {};
  const userPipelineFunctions = userConfig.pipelineFunctions || {};
  const { functions } = transformOutput;
  const { resolvers } = transformOutput;
  const { pipelineFunctions } = transformOutput;

  if (!opts?.disableFunctionOverrides) {
    Object.keys(userFunctions).forEach(userFunction => { functions[userFunction] = userFunctions[userFunction]; });
  }

  if (!opts?.disablePipelineFunctionOverrides) {
    const pipelineFunctionKeys = Object.keys(userPipelineFunctions);

    if (pipelineFunctionKeys.length > 0) {
      printer.warn(
        ' You are using the "pipelineFunctions" directory for overridden and custom resolvers. '
          + 'Please use the "resolvers" directory as "pipelineFunctions" will be deprecated.\n',
      );
    }

    pipelineFunctionKeys.forEach(userPipelineFunction => {
      resolvers[userPipelineFunction] = userPipelineFunctions[userPipelineFunction];
    });
  }

  if (!opts?.disableResolverOverrides) {
    Object.keys(userResolvers).forEach(userResolver => {
      if (userResolver !== 'README.md') {
        resolvers[userResolver] = userResolvers[userResolver].toString();
      }
    });
  }

  const stacks = overrideUserDefinedStacks(userConfig, transformOutput);

  return {
    ...transformOutput,
    functions,
    resolvers,
    pipelineFunctions,
    stacks,
  };
};

const overrideUserDefinedStacks = (
  userConfig: TransformerProjectConfig,
  transformOutput: DeploymentResources,
): Record<string, Template> => {
  const userStacks = userConfig.stacks || {};
  const { stacks, rootStack } = transformOutput;

  const resourceTypesToDependOn = {
    'AWS::CloudFormation::Stack': true,
    'AWS::AppSync::GraphQLApi': true,
    'AWS::AppSync::GraphQLSchema': true,
  };

  const allResourceIds = Object.keys(rootStack.Resources).filter((k: string) => {
    const resource = rootStack.Resources[k];
    return resourceTypesToDependOn[resource.Type];
  });

  const parametersKeys = Object.keys(rootStack.Parameters);
  const customStackParams = parametersKeys.reduce(
    (acc: $TSAny, k: string) => ({
      ...acc,
      [k]: Fn.Ref(k),
    }),
    {},
  );

  customStackParams[ResourceConstants.PARAMETERS.AppSyncApiId] = Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId');

  const updatedParameters = rootStack.Parameters;

  Object.keys(userStacks).forEach(userStack => {
    if (stacks[userStack]) {
      throw new Error(`You cannot provide a stack named ${userStack} as it \
            will be overwritten by a stack generated by the GraphQL Transform.`);
    }
    const userDefinedStack = userStacks[userStack];

    Object.keys(userDefinedStack.Parameters).forEach(key => {
      if (customStackParams[key] == null) {
        customStackParams[key] = Fn.Ref(key);

        if (updatedParameters[key]) throw new Error(`Cannot redefine CloudFormation parameter ${key} in stack ${userStack}.`);
        else updatedParameters[key] = userDefinedStack.Parameters[key];
      }
    });

    const parametersForStack = Object.keys(userDefinedStack.Parameters).reduce(
      (acc, k) => ({
        ...acc,
        [k]: customStackParams[k],
      }),
      {},
    );

    stacks[userStack] = userDefinedStack;

    const stackResourceId = userStack.split(/[^A-Za-z]/).join('');
    const customNestedStack = new CloudFormation.Stack({
      Parameters: parametersForStack,
      TemplateURL: Fn.Join('/', [
        'https://s3.amazonaws.com',
        Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
        'stacks',
        userStack,
      ]),
    }).dependsOn(allResourceIds);
    rootStack.Resources[stackResourceId] = customNestedStack;
  });

  rootStack.Parameters = updatedParameters;

  return stacks;
};

/**
 * Writes a deployment to disk at a path.
 */
export const writeDeploymentToDisk = async (
  deployment: DeploymentResources,
  directory: string,
  rootStackFileName = 'rootStack.json',
  buildParameters: $TSAny,
  minify = false,
): Promise<void> => {
  fs.ensureDirSync(directory);
  // Delete the last deployments resources except for tsconfig if present
  emptyBuildDirPreserveTsconfig(directory);

  // Write the schema to disk
  const { schema } = deployment;
  const fullSchemaPath = path.normalize(`${directory}/schema.graphql`);
  fs.writeFileSync(fullSchemaPath, schema);

  // Setup the directories if they do not exist.
  initStacksAndResolversDirectories(directory);

  // Write resolvers to disk
  const resolverFileNames = Object.keys(deployment.resolvers);
  const resolverRootPath = resolverDirectoryPath(directory);

  resolverFileNames.forEach(resolverFileName => {
    const fullResolverPath = path.normalize(`${resolverRootPath}/${resolverFileName}`);
    const hash = crc.crc32(deployment.resolvers[resolverFileName]).toString(16);

    fs.writeFileSync(fullResolverPath, `## HASH: ${hash}\n${deployment.resolvers[resolverFileName]}`);
  });

  // Write pipeline resolvers to disk
  const pipelineFunctions = Object.keys(deployment.pipelineFunctions);
  const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory);

  pipelineFunctions.forEach(functionFileName => {
    const fullTemplatePath = path.normalize(`${pipelineFunctionRootPath}/${functionFileName}`);
    fs.writeFileSync(fullTemplatePath, deployment.pipelineFunctions[functionFileName]);
  });

  // Write the stacks to disk
  const stackNames = Object.keys(deployment.stacks);
  const stackRootPath = stacksDirectoryPath(directory);

  stackNames.forEach(async stackFileName => {
    const fileNameParts = stackFileName.split('.');
    if (fileNameParts.length === 1) {
      fileNameParts.push('json');
    }
    const fullFileName = fileNameParts.join('.');
    throwIfNotJSONExt(fullFileName);
    const fullStackPath = path.normalize(`${stackRootPath}/${fullFileName}`);
    let stackContent = deployment.stacks[stackFileName];
    if (typeof stackContent === 'string') {
      stackContent = JSON.parse(stackContent);
    }
    await prePushCfnTemplateModifier(stackContent);
    fs.writeFileSync(fullStackPath, JSONUtilities.stringify(stackContent, { minify }));
  });

  // Write any functions to disk
  const functionNames = Object.keys(deployment.functions);
  const functionRootPath = path.normalize(`${directory}/functions`);
  if (!fs.existsSync(functionRootPath)) {
    fs.mkdirSync(functionRootPath);
  }

  functionNames.forEach(functionName => {
    const fullFunctionPath = path.normalize(`${functionRootPath}/${functionName}`);
    const zipContents = fs.readFileSync(deployment.functions[functionName]);
    fs.writeFileSync(fullFunctionPath, zipContents);
  });
  const { rootStack } = deployment;
  const rootStackPath = path.normalize(`${directory}/${rootStackFileName}`);
  const rootStackString = minify ? JSON.stringify(rootStack) : JSON.stringify(rootStack, null, 4);
  fs.writeFileSync(rootStackPath, rootStackString);

  // Write params to disk
  const jsonString = JSON.stringify(buildParameters, null, 4);
  const parametersOutputFilePath = path.join(directory, PARAMETERS_FILE_NAME);
  fs.writeFileSync(parametersOutputFilePath, jsonString);
};

const initStacksAndResolversDirectories = (directory: string): void => {
  const resolverRootPath = resolverDirectoryPath(directory);
  if (!fs.existsSync(resolverRootPath)) {
    fs.mkdirSync(resolverRootPath);
  }
  const stackRootPath = stacksDirectoryPath(directory);
  if (!fs.existsSync(stackRootPath)) {
    fs.mkdirSync(stackRootPath);
  }
};

const pipelineFunctionDirectoryPath = (rootPath: string): string => path.normalize(path.join(rootPath, 'pipelineFunctions'));

const resolverDirectoryPath = (rootPath: string): string => path.normalize(`${rootPath}/resolvers`);

const stacksDirectoryPath = (rootPath: string): string => path.normalize(`${rootPath}/stacks`);

/**
 * validate JSON file extension
 */
export const throwIfNotJSONExt = (stackFile: string): void => {
  const extension = path.extname(stackFile);
  if (extension === '.yaml' || extension === '.yml') {
    throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
  }
  if (extension !== '.json') {
    throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
  }
};

const emptyBuildDirPreserveTsconfig = (directory: string): void => {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fileDir = path.join(directory, file);
    if (fs.lstatSync(fileDir).isDirectory()) {
      rimraf.sync(fileDir);
    } else if (!file.endsWith('tsconfig.resource.json')) {
      fs.unlinkSync(fileDir);
    }
  });
};
