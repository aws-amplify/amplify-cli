import { pathManager, stateManager } from 'amplify-cli-core';

/**
 * Get all locally configured environments
 */
export const getAllEnvs = (): string[] => {
  try {
    pathManager.getLocalAWSInfoFilePath();
  } catch (err) {
    // if the file doesn't exist or the project is not initialized
    return [];
  }
  return Object.keys(stateManager.getLocalAWSInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  }));
};
