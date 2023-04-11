import { $TSObject, stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * Checks if auth already exists in the project and prints a warning if so.
 * Returns true if auth already exists, false otherwise
 */
export const projectHasAuth = (): boolean => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const existingAuthResources: [string, $TSObject][] = Object.entries(meta?.auth || {});
  if (existingAuthResources.length > 0) {
    return true;
  }
  return false;
};
