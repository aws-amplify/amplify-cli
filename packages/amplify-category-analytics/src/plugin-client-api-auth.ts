import {
  $TSContext, AmplifyCategories,
} from 'amplify-cli-core';

/**
 * Push auth resources to the cloud
 * @returns Resource in Notifications category (IAmplifyResource type)
 */
export const invokeAuthPush = async (context: $TSContext): Promise<void> => {
  await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'authPluginAPIPush', [context]);
};
