import { $TSContext } from 'amplify-cli-core';
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
export const resolveAppId = async (context: $TSContext): Promise<string> => {
  const appId = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'resolveAppId', [context]) as string;
  return appId;
};

/**
 * Returns the appId or throws an error if it's not found.
 */
export const getAppId = async (context: $TSContext, appId?: string): Promise<string> => {
  const resolvedAppId = appId || extractArgs(context).appId || (await resolveAppId(context));

  if (!resolvedAppId) {
    throw new Error(
      'Unable to sync Studio components since appId could not be determined. This can happen when you hit the soft limit of number of apps that you can have in Amplify console.',
    );
  }
  return resolvedAppId;
};
