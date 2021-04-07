import { stateManager } from 'amplify-cli-core';

export function getProjectMeta() {
  if (!stateManager.metaFileExists()) {
    const error = new Error(
      `
      No Amplify backend project files detected within this folder. Either initialize a new Amplify project or pull an existing project.
      - "amplify init" to initialize a new Amplify project
      - "amplify pull <app-id>" to pull your existing Amplify project. Find the <app-id> in the AWS Console or Amplify Admin UI.
      `,
    );

    error.name = 'NotInitialized';
    error.stack = undefined;

    throw error;
  }

  return stateManager.getMeta();
}
