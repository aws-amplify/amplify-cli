import { stateManager } from 'amplify-cli-core';

/**
 * Get all locally configured environments
 */
export const getAllEnvs = (): string[] => Object.keys(stateManager.getLocalAWSInfo(undefined, {
  throwIfNotExist: false,
  default: {},
}));
