import * as path from 'path';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';
export * from './projectMeta';
export * from './transformConfig';
export * from './awsExports';
export * from './sdk-calls';
export * from './api';

export { getCLIPath, isCI, createNewProjectDir } from 'amplify-e2e-core';

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
