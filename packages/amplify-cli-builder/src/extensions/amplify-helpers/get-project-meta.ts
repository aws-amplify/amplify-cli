import { NotInitializedError, stateManager } from 'amplify-cli-core';

export function getProjectMeta() {
  if (!stateManager.metaFileExists()) {
    throw new NotInitializedError();
  }

  return stateManager.getMeta();
}
