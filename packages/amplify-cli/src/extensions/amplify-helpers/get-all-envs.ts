import { stateManager } from 'amplify-cli-core';

export function getAllEnvs(): string[] {
  let allEnvs: string[] = [];

  const envInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  allEnvs = Object.keys(envInfo);

  return allEnvs;
}
