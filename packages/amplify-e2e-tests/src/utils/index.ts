import * as path from 'path';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';
export * from './projectMeta';
export * from './transformConfig';
export * from './awsExports';
export * from './sdk-calls';
export * from './api';

// run dotenv config to update env variable
config();

export function getCLIPath() {
  return path.join(__dirname, '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
}

export function createNewProjectDir(root?: string): string {
  if (!root) {
    root = path.join(__dirname, '../../../..', `amplify-integ-${Math.round(Math.random() * 100)}-test-${Math.round(Math.random() * 1000)}`);
  }
  fs.mkdirSync(root);
  return root;
}

export function deleteProjectDir(root: string) {
  return rimraf.sync(root);
}

export function isCI(): Boolean {
  return process.env.CI ? true : false;
}

export function getEnvVars(): { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string } {
  return { ...process.env } as { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string };
}
