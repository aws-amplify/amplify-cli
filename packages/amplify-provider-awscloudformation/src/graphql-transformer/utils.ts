import fs from 'fs-extra';
import * as path from 'path';
import { DeploymentResources } from '@aws-amplify/graphql-transformer-core';
import rimraf from 'rimraf';
import { JSONUtilities } from 'amplify-cli-core';
import { Template } from 'cloudform';
import { Diff, diff as getDiffs } from 'deep-diff';

const ROOT_STACK_FILE_NAME = 'cloudformation-template.json';
const PARAMETERS_FILE_NAME = 'parameters.json';
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

export const getGqlUpdatedResource = (resources: any[]) => {
  if (resources.length > 0) {
    const resource = resources[0];
    if (
      resource.service === 'AppSync' &&
      resource.providerMetadata &&
      resource.providerMetadata.logicalId &&
      resource.providerPlugin === 'awscloudformation'
    ) {
      return resource;
    }
  }
  return null;
};

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
  rimraf.sync(directory);
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
  const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory);
  if (!fs.existsSync(pipelineFunctionRootPath)) {
    fs.mkdirSync(pipelineFunctionRootPath);
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
