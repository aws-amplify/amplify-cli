import fs from 'fs-extra';
import * as path from 'path';
import { TransformerProjectConfig, DeploymentResources } from '@aws-amplify/graphql-transformer-core';
import rimraf from 'rimraf';
import { ProviderName as providerName } from '../constants';
import { $TSContext, JSONUtilities, stateManager } from 'amplify-cli-core';
import { CloudFormation, Template, Fn } from 'cloudform';
import { Diff, diff as getDiffs } from 'deep-diff';
import { ResourceConstants } from 'graphql-transformer-common';
import { pullAllBy, find } from 'lodash';
import { isAmplifyAdminApp } from '../utils/admin-helpers';
import { printer } from 'amplify-prompts';

const ROOT_STACK_FILE_NAME = 'cloudformation-template.json';
const PARAMETERS_FILE_NAME = 'parameters.json';
const AMPLIFY_ADMIN_ROLE = '_Full-access/CognitoIdentityCredentials';
const AMPLIFY_MANAGE_ROLE = '_Manage-only/CognitoIdentityCredentials';
export interface DiffableProject {
  stacks: {
    [stackName: string]: Template;
  };
  root: Template;
}

export type DiffChanges<T> = Array<Diff<DiffableProject, DiffableProject>>;

export interface GQLDiff {
  diff: DiffChanges<DiffableProject>;
  next: DiffableProject;
  current: DiffableProject;
}

export const getIdentityPoolId = async (ctx: $TSContext): Promise<string | undefined> => {
  const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('auth');
  const authResources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName');
  const authResource = find(authResources, { service: 'Cognito', providerPlugin: providerName }) as any;
  return authResource?.output?.IdentityPoolId;
};

export const getAdminRoles = async (ctx: $TSContext, apiResourceName: string): Promise<Array<string>> => {
  const currentEnv = ctx.amplify.getEnvInfo().envName;
  const adminRoles = new Array<string>();
  //admin ui roles
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

  // lambda functions which have access to the api
  const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('function');
  const resources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName')
    .filter((r: any) => r.dependsOn?.some((d: any) => d?.resourceName === apiResourceName))
    .map((r: any) => `${r.resourceName}-${currentEnv}`);
  adminRoles.push(...resources);
  return adminRoles;
};

export const getGQLDiff = (currentBackendDir: string, cloudBackendDir: string): GQLDiff => {
  const currentBuildDir = path.join(currentBackendDir, 'build');
  const cloudBuildDir = path.join(cloudBackendDir, 'build');
  if (fs.existsSync(cloudBuildDir) && fs.existsSync(currentBuildDir)) {
    const current = loadDiffableProject(cloudBuildDir, ROOT_STACK_FILE_NAME);
    const next = loadDiffableProject(currentBuildDir, ROOT_STACK_FILE_NAME);
    return { current, next, diff: getDiffs(current, next) };
  }
  return null;
};

export const getGqlUpdatedResource = (resources: any[]) =>
  resources.find(
    resource =>
      resource?.service === 'AppSync' && resource?.providerMetadata?.logicalId && resource?.providerPlugin === 'awscloudformation',
  ) || null;

export function loadDiffableProject(path: string, rootStackName: string): DiffableProject {
  const project = readFromPath(path);
  const currentStacks = project.stacks || {};
  const diffableProject: DiffableProject = {
    stacks: {},
    root: {},
  };
  for (const key of Object.keys(currentStacks)) {
    diffableProject.stacks[key] = JSONUtilities.parse(project.stacks[key]);
  }
  if (project[rootStackName]) {
    diffableProject.root = JSONUtilities.parse(project[rootStackName]);
  }
  return diffableProject;
}

export function readFromPath(directory: string): any {
  const pathExists = fs.pathExistsSync(directory);
  if (!pathExists) {
    return;
  }
  const dirStats = fs.lstatSync(directory);
  if (!dirStats.isDirectory()) {
    const buf = fs.readFileSync(directory);
    return buf.toString();
  }
  const files = fs.readdirSync(directory);
  const accum = {};
  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    const value = readFromPath(fullPath);
    accum[fileName] = value;
  }
  return accum;
}

export function mergeUserConfigWithTransformOutput(
  userConfig: TransformerProjectConfig,
  transformOutput: DeploymentResources,
  opts?: any,
): DeploymentResources {
  const userFunctions = userConfig.functions || {};
  const userResolvers = userConfig.resolvers || {};
  const userPipelineFunctions = userConfig.pipelineFunctions || {};
  const functions = transformOutput.functions;
  const resolvers = transformOutput.resolvers;
  const pipelineFunctions = transformOutput.pipelineFunctions;

  if (!opts?.disableFunctionOverrides) {
    for (const userFunction of Object.keys(userFunctions)) {
      functions[userFunction] = userFunctions[userFunction];
    }
  }

  if (!opts?.disablePipelineFunctionOverrides) {
    const pipelineFunctionKeys = Object.keys(userPipelineFunctions);

    if (pipelineFunctionKeys.length > 0) {
      printer.warn(
        ' You are using the "pipelineFunctions" directory for overridden and custom resolvers. ' +
          'Please use the "resolvers" directory as "pipelineFunctions" will be deprecated.\n',
      );
    }

    for (const userPipelineFunction of pipelineFunctionKeys) resolvers[userPipelineFunction] = userPipelineFunctions[userPipelineFunction];
  }

  if (!opts?.disableResolverOverrides) {
    for (const userResolver of Object.keys(userResolvers)) {
      if (userResolver !== 'README.md') {
        resolvers[userResolver] = userResolvers[userResolver].toString();
      }
    }
  }

  const stacks = overrideUserDefinedStacks(userConfig, transformOutput);

  return {
    ...transformOutput,
    functions,
    resolvers,
    pipelineFunctions,
    stacks,
  };
}

function overrideUserDefinedStacks(userConfig: TransformerProjectConfig, transformOutput: DeploymentResources) {
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
    (acc: any, k: string) => ({
      ...acc,
      [k]: Fn.Ref(k),
    }),
    {},
  );

  customStackParams[ResourceConstants.PARAMETERS.AppSyncApiId] = Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId');

  let updatedParameters = rootStack.Parameters;

  for (const userStack of Object.keys(userStacks)) {
    if (stacks[userStack]) {
      throw new Error(`You cannot provide a stack named ${userStack} as it \
            will be overwritten by a stack generated by the GraphQL Transform.`);
    }
    const userDefinedStack = userStacks[userStack];

    for (const key of Object.keys(userDefinedStack.Parameters)) {
      if (customStackParams[key] == null) {
        customStackParams[key] = Fn.Ref(key);

        if (updatedParameters[key]) throw new Error(`Cannot redefine CloudFormation parameter ${key} in stack ${userStack}.`);
        else updatedParameters[key] = userDefinedStack.Parameters[key];
      }
    }

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
  }

  rootStack.Parameters = updatedParameters;

  return stacks;
}

/**
 * Writes a deployment to disk at a path.
 */
export async function writeDeploymentToDisk(
  deployment: DeploymentResources,
  directory: string,
  rootStackFileName: string = 'rootStack.json',
  buildParameters: Object,
  minify = false,
) {
  // Delete the last deployments resources.
  //rimraf.sync(directory);
  emptyBuildDir(directory);
  fs.ensureDirSync(directory);

  // Write the schema to disk
  const schema = deployment.schema;
  const fullSchemaPath = path.normalize(directory + `/schema.graphql`);
  fs.writeFileSync(fullSchemaPath, schema);

  // Setup the directories if they do not exist.
  initStacksAndResolversDirectories(directory);

  // Write resolvers to disk
  const resolverFileNames = Object.keys(deployment.resolvers);
  const resolverRootPath = resolverDirectoryPath(directory);
  for (const resolverFileName of resolverFileNames) {
    const fullResolverPath = path.normalize(resolverRootPath + '/' + resolverFileName);
    fs.writeFileSync(fullResolverPath, deployment.resolvers[resolverFileName]);
  }

  // Write pipeline resolvers to disk
  const pipelineFunctions = Object.keys(deployment.pipelineFunctions);
  const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory);
  for (const functionFileName of pipelineFunctions) {
    const fullTemplatePath = path.normalize(pipelineFunctionRootPath + '/' + functionFileName);
    fs.writeFileSync(fullTemplatePath, deployment.pipelineFunctions[functionFileName]);
  }

  // Write the stacks to disk
  const stackNames = Object.keys(deployment.stacks);
  const stackRootPath = stacksDirectoryPath(directory);
  for (const stackFileName of stackNames) {
    const fileNameParts = stackFileName.split('.');
    if (fileNameParts.length === 1) {
      fileNameParts.push('json');
    }
    const fullFileName = fileNameParts.join('.');
    throwIfNotJSONExt(fullFileName);
    const fullStackPath = path.normalize(stackRootPath + '/' + fullFileName);
    let stackString: any = deployment.stacks[stackFileName];
    stackString =
      typeof stackString === 'string'
        ? deployment.stacks[stackFileName]
        : JSONUtilities.stringify(deployment.stacks[stackFileName], { minify });
    fs.writeFileSync(fullStackPath, stackString);
  }

  // Write any functions to disk
  const functionNames = Object.keys(deployment.functions);
  const functionRootPath = path.normalize(directory + `/functions`);
  if (!fs.existsSync(functionRootPath)) {
    fs.mkdirSync(functionRootPath);
  }
  for (const functionName of functionNames) {
    const fullFunctionPath = path.normalize(functionRootPath + '/' + functionName);
    const zipContents = fs.readFileSync(deployment.functions[functionName]);
    fs.writeFileSync(fullFunctionPath, zipContents);
  }
  const rootStack = deployment.rootStack;
  const rootStackPath = path.normalize(directory + `/${rootStackFileName}`);
  const rootStackString = minify ? JSON.stringify(rootStack) : JSON.stringify(rootStack, null, 4);
  fs.writeFileSync(rootStackPath, rootStackString);

  // Write params to disk
  const jsonString = JSON.stringify(buildParameters, null, 4);
  const parametersOutputFilePath = path.join(directory, PARAMETERS_FILE_NAME);
  fs.writeFileSync(parametersOutputFilePath, jsonString);
}

function initStacksAndResolversDirectories(directory: string) {
  const resolverRootPath = resolverDirectoryPath(directory);
  if (!fs.existsSync(resolverRootPath)) {
    fs.mkdirSync(resolverRootPath);
  }
  const stackRootPath = stacksDirectoryPath(directory);
  if (!fs.existsSync(stackRootPath)) {
    fs.mkdirSync(stackRootPath);
  }
}

function pipelineFunctionDirectoryPath(rootPath: string) {
  return path.normalize(path.join(rootPath, 'pipelineFunctions'));
}

function resolverDirectoryPath(rootPath: string) {
  return path.normalize(rootPath + `/resolvers`);
}

function stacksDirectoryPath(rootPath: string) {
  return path.normalize(rootPath + `/stacks`);
}

export function throwIfNotJSONExt(stackFile: string) {
  const extension = path.extname(stackFile);
  if (extension === '.yaml' || extension === '.yml') {
    throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
  }
  if (extension !== '.json') {
    throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
  }
}

const emptyBuildDir = (directory: string) => {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const fileDir = path.join(directory, file);
    if (fs.lstatSync(fileDir).isDirectory()) {
      rimraf.sync(fileDir);
    } else if (!file.includes('tsconfig.resource.json')) {
      fs.unlinkSync(fileDir);
    }
  });
};
