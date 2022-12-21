import { $TSAny, stateManager } from 'amplify-cli-core';
import { getEnvInfo } from './get-env-info';

/**
 * Amplify project's persistent state
 */
export interface IAmplifyProjectDetails {
  projectConfig : $TSAny,
  amplifyMeta: $TSAny,
  localEnvInfo: $TSAny,
  backendConfig: $TSAny,
}

/**
 * Gets metadata about the project
 */
export const getProjectDetails = (): IAmplifyProjectDetails => {
  const projectConfig = stateManager.getProjectConfig();

  let amplifyMeta = {};
  let backendConfig = {};

  if (stateManager.metaFileExists()) {
    amplifyMeta = stateManager.getMeta();
  }

  if (stateManager.backendConfigFileExists()) {
    backendConfig = stateManager.getBackendConfig();
  }

  const localEnvInfo = getEnvInfo();

  return {
    projectConfig,
    amplifyMeta,
    localEnvInfo,
    backendConfig,
  };
};
