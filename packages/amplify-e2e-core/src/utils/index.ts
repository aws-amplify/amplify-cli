import * as path from 'path';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';
import execa from 'execa';
import { getLayerDirectoryName, LayerDirectoryType } from '..';

export * from './add-circleci-tags';
export * from './api';
export * from './appsync';
export * from './envVars';
export * from './getAppId';
export * from './headless';
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

// run dotenv config to update env variable
config();

export function deleteProjectDir(root: string) {
  rimraf.sync(root);
}

export function deleteAmplifyDir(root: string) {
  rimraf.sync(path.join(root, 'amplify'));
}

export function loadFunctionTestFile(fileName: string) {
  const functionPath = getTestFileNamePath(fileName);
  return fs.readFileSync(functionPath, 'utf-8').toString();
}

export function addNodeDependencies(root: string, functionName: string, dependencies: string[]) {
  let indexPath = path.join(getPathToFunction(root, functionName), 'src');
  execa.commandSync(`yarn add ${dependencies.join(' ')}`, { cwd: indexPath });
}

export function overrideFunctionCodeNode(root: string, functionName: string, sourceFileName: string, targetFileName: string = 'index.js') {
  const sourcePath = getTestFileNamePath(sourceFileName);
  const targetPath = path.join(getPathToFunction(root, functionName), 'src', targetFileName);

  fs.copySync(sourcePath, targetPath);
}

export function overrideFunctionCodePython(
  root: string,
  functionName: string,
  sourceFileName: string,
  targetFileName: string = 'index.py',
) {
  const sourcePath = getTestFileNamePath(sourceFileName);
  const targetPath = path.join(getPathToFunction(root, functionName), 'lib', 'python', targetFileName);

  fs.copySync(sourcePath, targetPath);
}

export function overrideFunctionSrcNode(root: string, functionName: string, content: string, targetFileName: string = 'index.js') {
  const dirPath = path.join(getPathToFunction(root, functionName), 'src');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
}

export function overrideFunctionSrcPython(root: string, functionName: string, content: string, targetFileName: string = 'index.py') {
  const dirPath = path.join(getPathToFunction(root, functionName), 'src');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
}

export function overrideLayerCodeNode(
  root: string,
  projName: string,
  layerName: string,
  content: string,
  targetFileName: string = 'index.js',
) {
  const dirPath = path.join(getPathToLayer(root, { projName, layerName }), 'lib', 'nodejs');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
}

export function overrideLayerCodePython(
  root: string,
  projName: string,
  layerName: string,
  content: string,
  targetFileName: string = 'index.py',
) {
  const dirPath = path.join(getPathToLayer(root, { projName, layerName }), 'lib', 'python');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
}

export function addOptFile(root: string, projName: string, layerName: string, content: string, targetFileName: string): void {
  const dirPath = path.join(getPathToLayer(root, { projName, layerName }), 'opt');
  const targetPath = path.join(dirPath, targetFileName);

  fs.ensureDirSync(dirPath);
  fs.writeFileSync(targetPath, content);
}

export function getFunctionSrcNode(root: string, functionName: string, fileName: string = 'index.js'): string {
  const indexPath = path.join(getPathToFunction(root, functionName), 'src', fileName);

  return fs.readFileSync(indexPath).toString();
}

const getTestFileNamePath = (fileName: string): string =>
  path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'functions', fileName);
const getPathToFunction = (root: string, funcName: string): string => path.join(root, 'amplify', 'backend', 'function', funcName);
const getPathToLayer = (root: string, layerProjName: LayerDirectoryType): string =>
  path.join(root, 'amplify', 'backend', 'function', getLayerDirectoryName(layerProjName));
