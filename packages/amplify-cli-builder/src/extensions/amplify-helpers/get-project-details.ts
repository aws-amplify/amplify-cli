import { getEnvInfo } from './get-env-info';
import { stateManager } from 'amplify-cli-core';

export function getProjectDetails() {
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
}
