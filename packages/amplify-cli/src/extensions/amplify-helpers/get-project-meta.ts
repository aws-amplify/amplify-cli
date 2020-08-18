import { stateManager, pathManager } from 'amplify-cli-core';

export function getProjectMeta() {
  if (!pathManager.getAmplifyMetaFilePath() || !stateManager.isMetaFileExists()) {
    const error = new Error(
      "You are not working inside a valid Amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project, or 'amplify pull' to pull down an existing project.",
    );

    error.name = 'NotInitialized';
    error.stack = undefined;

    throw error;
  }

  return stateManager.getMeta();
}
