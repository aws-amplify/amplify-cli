import { StackEvent } from 'aws-sdk/clients/cloudformation';
import { Message } from './../../../../amplify-cli-core/lib/banner-message/index.d';
import { $TSAny, AmplifyError, stateManager } from 'amplify-cli-core';

/**
 * returns the current environment info
 */
let exceptionPrinted = false;

export const getEnvInfo = (): $TSAny => {
try {
  if (stateManager.localEnvInfoExists()) {
    return stateManager.getLocalEnvInfo();
  }
  throw new AmplifyError('EnvironmentNotInitializedError', {
    message: 'Current environment cannot be determined.',
    resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
    cause: new Error('`amplify init` not done'),
  }); 
  // handle error message gracefully by swallowing the stack trace
} catch(error) {
  if (!exceptionPrinted) {
    exceptionPrinted = true;
    console.error(`Error: ${error.message}\nResolution: ${error.resolution}`);
  } 
}
};
