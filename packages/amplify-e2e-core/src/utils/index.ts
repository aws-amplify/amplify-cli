import * as path from 'path';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';

export * from './api';
export * from './appsync';
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

// run dotenv config to update env variable
config();

export function deleteProjectDir(root: string) {
  return rimraf.sync(root);
}

export function getEnvVars(): { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string } {
  return { ...process.env } as { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string };
}

export function overrideFunctionSrc(root: string, name: string, code: string) {
  let indexPath = path.join(root, `amplify/backend/function/${name}/src/index.js`);
  fs.writeFileSync(indexPath, code);
}

export function getFunctionSrc(root: string, name: string): Buffer {
  let indexPath = path.join(root, `amplify/backend/function/${name}/src/index.js`);
  return fs.readFileSync(indexPath);
}

//overriding code for node
export function overrideLayerCode(root: string, name: string, code: string, fileName: string) {
  const dirPath = path.join(root, `amplify/backend/function/${name}/lib/nodejs/node_modules/${name}`);
  fs.ensureDirSync(dirPath);
  const filePath = path.join(dirPath, `${fileName}`);
  fs.writeFileSync(filePath, code);
}

// overriding code for python
export function overrideFunctionSrcPython(root: string, name: string, source: string) {
  const destFilePath = path.join(root, `amplify/backend/function/${name}/src/index.py`);
  fs.copyFile(source, destFilePath, err => {
    if (err) throw new Error('Problem in copying file in Tests');
  });
}

export function overrideLayerCodePython(root: string, name: string, source: string, fileName: string) {
  const dirPath = path.join(root, `amplify/backend/function/${name}/lib/python/lib/python3.8/site-packages/`);
  fs.ensureDirSync(dirPath);
  const destfilePath = path.join(dirPath, `testfunc.py`);
  fs.copyFile(source, destfilePath, err => {
    if (err) throw new Error('Problem in copying file in Tests');
  });
}

export function overridefunctionSrcJava(root: string, name: string, source: string) {
  const destFilePath = path.join(root, `amplify/backend/function/${name}/build.gradle`);
  fs.copyFile(source, destFilePath, err => {
    if (err) throw new Error('Problem in copying file in Tests');
  });
}

export function ovverrideLayerCodeJava(root: string, layerName: string, functionName: string) {
  const destDir = path.join(root, `amplify/backend/function/${layerName}/lib/java/lib`);
  const srcDir = path.join(root, `amplify/backend/function/${functionName}/build/java/lib`);

  fs.copy(srcDir, destDir, err => {
    if (err) throw new Error('Problem in copying file in Tests');
  });
}
