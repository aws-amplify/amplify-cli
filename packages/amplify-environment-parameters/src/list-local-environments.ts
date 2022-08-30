import { stateManager } from 'amplify-cli-core';

/**
 * Get a list of all the locally configured Amplify environment names
 */
export const listLocalEnvNames = (): string[] => Object.keys(
  stateManager.getLocalAWSInfo(undefined, { throwIfNotExist: false }) || {},
);
