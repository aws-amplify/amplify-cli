import { $TSMeta, projectNotInitializedError, stateManager } from '..';

/**
 * returns project meta
 */
export const getProjectMeta = (): $TSMeta => {
  if (!stateManager.metaFileExists()) {
    throw projectNotInitializedError();
  }

  return stateManager.getMeta();
};
