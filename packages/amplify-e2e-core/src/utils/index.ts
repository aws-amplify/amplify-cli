/* eslint-disable import/no-cycle */
import * as path from 'path';
import * as fs from 'fs-extra';
import { rimrafSync } from 'rimraf';
import { config } from 'dotenv';
import execa from 'execa';
import { v4 as uuid } from 'uuid';
import { getLayerDirectoryName, LayerDirectoryType } from '..';

export * from './add-circleci-tags';
export * from './api';
export * from './appsync';
export * from './auth-utils';
export * from './envVars';
export * from './getAppId';
export * from './headless';
export * from './overrides';
export * from './nexpect';
export * from './pinpoint';
export * from './projectMeta';
export * from './readJsonFile';
export * from './request';
export * from './retrier';
export * from './sdk-calls';
export * from './selectors';
export * from './sleep';
export * from './transformConfig';
export * from './admin-ui';
export * from './hooks';
export * from './git-operations';
export * from './help';
export * from './credentials-rotator';

/**
 * Whether the current environment is CircleCI or not
 */
export const isCI = (): boolean => JSON.parse(process.env.CI || 'false') && JSON.parse(process.env.CIRCLECI || 'false');

/**
 * Whether the current run is smoke test run.
 */
export const isSmokeTestRun = (): boolean => JSON.parse(process.env.IS_AMPLIFY_CLI_SMOKE_TEST_RUN || 'false');

// eslint-disable-next-line spellcheck/spell-checker
export const TEST_PROFILE_NAME = isCI() ? 'amplify-integ-test-user' : 'default';

// run dotenv config to update env variable
config();

/**
 * delete project directory
 */
export const deleteProjectDir = (root: string): void => {
  try {
    rimrafSync(root);
  } catch (e) {
    // directory does not exist/was already deleted
  }
};

/**
 * delete <project-root>/amplify directory
 */
export const deleteAmplifyDir = (root: string): void => {
  rimrafSync(path.join(root, 'amplify'));
};

/**
 * load test file
 */
export const loadFunctionTestFile = (fileName: string): string => {
  const functionPath = getTestFileNamePath(fileName);
  return fs.readFileSync(functionPath, 'utf-8').toString();
};

/**
 * install and save node dependencies
 */
export const addNodeDependencies = (root: string, functionName: string, dependencies: string[]): void => {
  const indexPath = path.join(getPathToFunction(root, functionName), 'src');
  execa.sync('yarn', ['add', ...dependencies], { cwd: indexPath });
};

/**
 * copy node function code from source to target
 */
export const overrideFunctionCodeNode = (root: string, functionName: string, sourceFileName: string, targetFileName = 'index.js'): void => {
  const sourcePath = getTestFileNamePath(sourceFileName);
  const targetPath = path.join(getPathToFunction(root, functionName), 'src', targetFileName);

  fs.copySync(sourcePath, targetPath);
};

/**
 * copy python function code from source to target
 */
export const overrideFunctionCodePython = (
  root: string,
  functionName: string,
  sourceFileName: string,
  targetFileName = 'index.py',
): void => {
  const sourcePath = getTestFileNamePath(sourceFileName);
  const targetPath = path.join(getPathToFunction(root, functionName), 'lib', 'python', targetFileName);

  fs.copySync(sourcePath, targetPath);
};

/**
 * overwrite node function /src
 */
export const overrideFunctionSrcNode = (root: string, functionName: string, content: string, targetFileName = 'index.js'): void => {
  const dirPath = path.join(getPathToFunction(root, functionName), 'src');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
};

/**
 * overwrite node function /src
 */
export const overrideFunctionSrcPython = (root: string, functionName: string, content: string, targetFileName = 'index.py'): void => {
  const dirPath = path.join(getPathToFunction(root, functionName), 'src');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
};

/**
 * overwrite node layer content
 */
export const overrideLayerCodeNode = (
  root: string,
  projectName: string,
  layerName: string,
  content: string,
  targetFileName = 'index.js',
): void => {
  const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'lib', 'nodejs');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
};

/**
 * overwrite python layer content
 */
export const overrideLayerCodePython = (
  root: string,
  projectName: string,
  layerName: string,
  content: string,
  targetFileName = 'index.py',
): void => {
  const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'lib', 'python');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
};

/**
 * write target file to layer resource's opt/<targetFileName>
 */
export const addOptFile = (root: string, projectName: string, layerName: string, content: string, targetFileName: string): void => {
  const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'opt');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
};

/**
 * get node function source file
 */
export const getFunctionSrcNode = (root: string, functionName: string, fileName = 'index.js'): string => {
  const indexPath = path.join(getPathToFunction(root, functionName), 'src', fileName);

  return fs.readFileSync(indexPath).toString();
};

const isWindowsPlatform = (): boolean => !!process?.platform?.startsWith('win');

const getTestFileNamePath = (fileName: string): string =>
  process.env.CODEBUILD_SRC_DIR && isWindowsPlatform()
    ? path.join(process.env.CODEBUILD_SRC_DIR, 'packages', 'amplify-e2e-tests', 'functions', fileName) // This condition is to account for a difference in the use of __dirname and paths in CodeBuild Windows jobs
    : path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'functions', fileName);
const getPathToFunction = (root: string, funcName: string): string => path.join(root, 'amplify', 'backend', 'function', funcName);
const getPathToLayer = (root: string, layerProjectName: LayerDirectoryType): string =>
  path.join(root, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjectName));

/**
 * Generate short v4 UUID
 * @returns short UUID
 */
export const generateRandomShortId = (): string => uuid().split('-')[0];
