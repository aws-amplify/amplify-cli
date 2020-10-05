import fs from 'fs-extra';
import * as path from 'path';
import { DeploymentResources } from '@aws-amplify/graphql-transformer-core';
import rimraf from 'rimraf';


const PARAMETERS_FILE_NAME = 'parameters.json';

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
        : minify
        ? JSON.stringify(deployment.stacks[stackFileName])
        : JSON.stringify(deployment.stacks[stackFileName], null, 4);
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
  return path.normalize(rootPath + `/pipelineFunctions`);
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