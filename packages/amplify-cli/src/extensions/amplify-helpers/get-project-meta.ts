import { $TSMeta, projectNotInitializedError, stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * returns project meta
 */
export const getProjectMeta = (): $TSMeta => {
  if (!stateManager.metaFileExists()) {
    throw projectNotInitializedError();
  }

  return stateManager.getMeta();
};
