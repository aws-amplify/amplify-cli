import { $TSAny, stateManager } from 'amplify-cli-core';
import { getEnvInfo } from './get-env-info';

/**
 * Gets metadata about the project
 */
export const getProjectDetails = (): { projectConfig: $TSAny; amplifyMeta: $TSAny; localEnvInfo: $TSAny; teamProviderInfo: $TSAny; } => {
  const projectConfig = stateManager.getProjectConfig();

  let amplifyMeta = {};

  if (stateManager.metaFileExists()) {
    amplifyMeta = stateManager.getMeta();
  }

  const localEnvInfo = getEnvInfo();

  let teamProviderInfo = {};

  if (stateManager.teamProviderInfoExists()) {
    teamProviderInfo = stateManager.getTeamProviderInfo();
  }

  return {
    projectConfig,
    amplifyMeta,
    localEnvInfo,
    teamProviderInfo,
  };
};
