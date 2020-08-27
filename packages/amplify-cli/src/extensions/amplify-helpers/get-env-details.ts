import { stateManager } from 'amplify-cli-core';

export function getEnvDetails() {
  const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  return teamProviderInfo;
}
