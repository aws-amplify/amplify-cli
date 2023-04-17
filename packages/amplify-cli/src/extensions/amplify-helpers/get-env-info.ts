import { $TSAny, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * returns the current environment info
 */
export const getEnvInfo = (): $TSAny => {
  if (stateManager.localEnvInfoExists()) {
    return stateManager.getLocalEnvInfo();
  }
  throw new AmplifyError('EnvironmentNotInitializedError', {
    message: 'Current environment cannot be determined.',
    resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
  });
};
