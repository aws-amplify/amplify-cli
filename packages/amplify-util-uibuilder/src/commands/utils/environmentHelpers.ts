import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { extractArgs } from './extractArgs';

/**
 * Get's the environment name from the given name or the context
 */
export const getEnvName = (context: $TSContext, envName?: string): string => {
  const args = extractArgs(context);
  return envName || args?.environmentName || context.exeInfo.localEnvInfo.envName;
};

/**
 *  Returns the appId from the context
 */
export const resolveAppId = (): string | undefined => {
  const meta = stateManager.getMeta();
  return meta?.providers?.awscloudformation?.AmplifyAppId;
};

/**
 * Returns the appId or throws an error if it's not found.
 */
export const getAppId = (context: $TSContext, appId?: string): string => {
  const resolvedAppId = appId || extractArgs(context).appId || resolveAppId();

  if (!resolvedAppId) {
    throw new Error(
      'Unable to sync Studio components since appId could not be determined. This can happen when you hit the soft limit of number of apps that you can have in Amplify console.',
    );
  }
  return resolvedAppId;
};
