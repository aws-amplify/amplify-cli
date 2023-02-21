import { $TSAny, stateManager } from '..';

/**
 * Gets the TPI file
 */
export const getEnvDetails = (): $TSAny => {
  const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  return teamProviderInfo;
};
