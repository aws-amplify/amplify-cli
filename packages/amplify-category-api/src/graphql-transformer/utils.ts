import fs from 'fs-extra';
import * as path from 'path';
import { TransformerProjectConfig, DeploymentResources } from '@aws-amplify/graphql-transformer-core';
import rimraf from 'rimraf';
import {
  $TSContext,
  AmplifyCategories,
  JSONUtilities,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { CloudFormation, Fn } from 'cloudform';
import { ResourceConstants } from 'graphql-transformer-common';
import { pullAllBy, find } from 'lodash';
import { printer } from 'amplify-prompts';
import { isAmplifyAdminApp, prePushCfnTemplateModifier } from 'amplify-provider-awscloudformation';
import { PROVIDER_NAME } from './provider-utils';

const PARAMETERS_FILE_NAME = 'parameters.json';
const CUSTOM_ROLES_FILE_NAME = 'custom-roles.json';
const AMPLIFY_ADMIN_ROLE = '_Full-access/CognitoIdentityCredentials';
const AMPLIFY_MANAGE_ROLE = '_Manage-only/CognitoIdentityCredentials';

interface CustomRolesConfig {
  adminRoleNames?: Array<string>;
}

export const getIdentityPoolId = async (ctx: $TSContext): Promise<string | undefined> => {
  const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('auth');
  const authResources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName');
  const authResource = find(authResources, { service: 'Cognito', providerPlugin: PROVIDER_NAME }) as any;
  return authResource?.output?.IdentityPoolId;
};

export const getAdminRoles = async (ctx: $TSContext, apiResourceName: string | undefined): Promise<Array<string>> => {
  let currentEnv;
  const adminRoles = new Array<string>();

  try {
    currentEnv = ctx.amplify.getEnvInfo().envName;
  } catch (err) {
    // When there is no environment info, return [] - This is required for sandbox pull
    return [];
  }

  //admin ui roles
  try {
    const amplifyMeta = stateManager.getMeta();
    const appId = amplifyMeta?.providers?.[PROVIDER_NAME]?.AmplifyAppId;
    const res = await isAmplifyAdminApp(appId);
    if (res.userPoolID) {
      adminRoles.push(`${res.userPoolID}${AMPLIFY_ADMIN_ROLE}`, `${res.userPoolID}${AMPLIFY_MANAGE_ROLE}`);
    }
  } catch (err) {
    // no need to error if not admin ui app
  }

  // additonal admin role checks
  if (apiResourceName) {
    // lambda functions which have access to the api
    const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('function');
    const resources = pullAllBy(allResources, resourcesToBeDeleted, 'resourceName')
      .filter((r: any) => r.dependsOn?.some((d: any) => d?.resourceName === apiResourceName))
      .map((r: any) => `${r.resourceName}-${currentEnv}`);
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
  fs.ensureDirSync(directory);
  // Delete the last deployments resources except for tsconfig if present
  emptyBuildDirPreserveTsconfig(directory);

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
    let stackContent = deployment.stacks[stackFileName];
    if (typeof stackContent === 'string') {
      stackContent = JSON.parse(stackContent);
    }
    await prePushCfnTemplateModifier(stackContent);
    fs.writeFileSync(fullStackPath, JSONUtilities.stringify(stackContent, { minify }));
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

function throwIfNotJSONExt(stackFile: string) {
  const extension = path.extname(stackFile);
  if (extension === '.yaml' || extension === '.yml') {
    throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
  }
  if (extension !== '.json') {
    throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
  }
}

const emptyBuildDirPreserveTsconfig = (directory: string) => {
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
