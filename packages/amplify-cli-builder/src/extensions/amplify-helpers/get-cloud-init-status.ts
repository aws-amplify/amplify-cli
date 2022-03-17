import * as fs from 'fs-extra';
import { pathManager } from 'amplify-cli-core';

export const CLOUD_INITIALIZED = 'CLOUD_INITIALIZED';
export const CLOUD_NOT_INITIALIZED = 'CLOUD_NOT_INITIALIZED';
export const NON_AMPLIFY_PROJECT = 'NON_AMPLIFY_PROJECT';

export function getCloudInitStatus() {
  const amplifyMetaPath = pathManager.getAmplifyMetaFilePath();
  const backendConfigPath = pathManager.getBackendConfigFilePath();

  if (fs.existsSync(amplifyMetaPath)) {
    return CLOUD_INITIALIZED;
  }

  if (fs.existsSync(backendConfigPath)) {
    return CLOUD_NOT_INITIALIZED;
  }

  return NON_AMPLIFY_PROJECT;
}
