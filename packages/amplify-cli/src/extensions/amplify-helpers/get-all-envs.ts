import { stateManager } from 'amplify-cli-core';

/**
 * Get all locally configured environments
 */
export const getAllEnvs = (): string[] => {
  let allEnvs: string[] = [];

  const envInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  allEnvs = Object.keys(envInfo);

  return allEnvs;
};
