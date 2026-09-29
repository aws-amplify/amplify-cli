import { pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { globSync } from 'glob';

const parametersJson = 'parameters.json';
const buildParametersJson = path.join('build', parametersJson);
const cliInputs = 'cli-inputs.json';
const rootStackFileName = 'root-cloudformation-stack.json';

const files = [
  'user-pool-group-precedence.json',
  'schema.graphql',
  buildParametersJson,
  'override.ts',
  parametersJson,
  'cli-inputs.json',
  'transfer.conf.json',
  'amplify.state',
  'custom-policies.json',
  path.join('src', 'package.json'),
  'layer-configuration.json',
  path.join('lib', 'nodejs', 'package.json'),
];
const redactSet = new Set<string>();
redactSet.add(parametersJson);
redactSet.add(buildParametersJson);
redactSet.add(cliInputs);
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
/**
 *  Collects files from each resource
 * @param resources list of resources containing the backend
 * @returns string[] of paths
 */
export const collectFiles = (
  resources: { category: string; resourceName: string; service: string }[],
  rootPath: string,
): { filePath: string; redact: boolean }[] => {
  const filePaths: { filePath: string; redact: boolean }[] = [];
  resources.reduce((arr, resource) => {
    const resourceDirectory = pathManager.getResourceDirectoryPath(rootPath, resource.category, resource.resourceName);
    files
      .map((r) => {
        return {
          filePath: path.join(resourceDirectory, r),
          redact: redactSet.has(r),
        };
      })
      .filter((r) => fs.existsSync(r.filePath))
      .forEach((file) => arr.push(file));
    if (resource.service === 'AppSync' && !fs.existsSync(path.join(resourceDirectory, 'schema.graphql'))) {
      const schemaDirectoryPath = path.join(resourceDirectory, 'schema');
      if (fs.existsSync(schemaDirectoryPath)) {
        const schemaFiles = globSync('**/*.graphql', { cwd: schemaDirectoryPath }).map((fileName) =>
          path.join(schemaDirectoryPath, fileName),
        );
        schemaFiles
          .map((r) => ({
            filePath: r,
            redact: false,
          }))
          .forEach((file) => arr.push(file));
      }
    }
    const cfnFiles = getCfnFiles(resourceDirectory);
    cfnFiles
      .map((r) => ({
        filePath: r,
        redact: false,
      }))
      .forEach((file) => arr.push(file));
    return arr;
  }, filePaths);
  // add root stack
  const rootStackPath = path.join(pathManager.getRootStackBuildDirPath(rootPath), rootStackFileName);
  if (fs.existsSync(rootStackPath)) {
    filePaths.push({
      filePath: rootStackPath,
      redact: false,
    });
  }

  // cli json file
  const cliJsonFile = pathManager.getCLIJSONFilePath(rootPath);
  if (fs.existsSync(cliJsonFile)) {
    filePaths.push({
      filePath: cliJsonFile,
      redact: false,
    });
  }

  // backend config file
  const backendConfigFile = pathManager.getBackendConfigFilePath(rootPath);
  if (fs.existsSync(backendConfigFile)) {
    filePaths.push({
      filePath: backendConfigFile,
      redact: false,
    });
  }

  return filePaths;
};

const getCfnFiles = (resourceDir: string): string[] => {
  const resourceBuildDir = path.join(resourceDir, 'build');

  /**
   * The API category w/ GraphQL builds into a build/ directory.
   * This looks for a build directory and uses it if one exists.
   * Otherwise falls back to the default behavior.
   */
  if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
    const cfnFiles = globSync(cfnTemplateGlobPattern, {
      cwd: resourceBuildDir,
      absolute: true,
      ignore: [parametersJson],
    });

    if (cfnFiles.length > 0) {
      return cfnFiles;
    }
  }

  const cfnFiles = globSync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    absolute: true,
    ignore: [parametersJson],
  });
  return cfnFiles;
};
