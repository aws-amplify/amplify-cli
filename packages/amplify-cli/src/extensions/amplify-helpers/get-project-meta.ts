import { $TSMeta, ProjectNotInitializedError, stateManager } from 'amplify-cli-core';

/**
 * returns project meta
 */
export const getProjectMeta = (): $TSMeta => {
  if (!stateManager.metaFileExists()) {
    throw new ProjectNotInitializedError();
  }

  return stateManager.getMeta();
};
