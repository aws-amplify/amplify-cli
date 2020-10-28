import { stateManager } from 'amplify-cli-core';

class UndeterminedEnvironmentError extends Error {
  constructor() {
    super(
      "Current environment cannot be determined\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
    );
    this.name = 'UndeterminedEnvironmentError';
    this.stack = undefined;
  }
}

export function getEnvInfo() {
  if (stateManager.localEnvInfoExists()) {
    return stateManager.getLocalEnvInfo();
  } else {
    // EnvInfo is required by all the callers so we can safely throw here
    throw new UndeterminedEnvironmentError();
  }
}
