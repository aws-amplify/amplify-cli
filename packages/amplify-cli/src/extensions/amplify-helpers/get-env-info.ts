import * as fs from 'fs-extra';
import { readJsonFile } from './read-json-file';
import { getLocalEnvFilePath } from './path-manager';

class UndeterminedEnvironmentError extends Error {
  constructor() {
    super(
      "Current environment cannot be determined\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
    );
    this.name = 'UndeterminedEnvironmentError';
  }
}

export function getEnvInfo() {
  const envFilePath = getLocalEnvFilePath();
  let envInfo: { envName?; defaultEditor? } = {};
  if (fs.existsSync(envFilePath)) {
    envInfo = readJsonFile(envFilePath);
  } else {
    // EnvInfo is required by all the callers so we can safely throw here
    throw new UndeterminedEnvironmentError();
  }

  return envInfo;
}
