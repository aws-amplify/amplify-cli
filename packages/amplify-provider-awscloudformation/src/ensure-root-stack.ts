import { $TSContext, stateManager } from 'amplify-cli-core';
import constants from './constants';
import { run as initializeRootStack } from './initializer';

/**
 * Checks if the root stack exists.
 * If not it is created and the deployment bucket is populated with current cloud backend and other meta files
 */
export const ensureRootStack = async (context: $TSContext): Promise<$TSContext> => {
  if (rootStackExists()) {
    return context;
  }
  await initializeRootStack(context);
  await context.exeInfo.deferredInitCallback(context);
  return context;
};

export const rootStackExists = () => {
  const meta = stateManager.getMeta();
  return !!meta?.providers?.[constants.ProviderName]?.DeploymentBucketName;
};
