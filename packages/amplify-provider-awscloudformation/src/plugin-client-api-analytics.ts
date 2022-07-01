import { $TSAny, $TSContext, AmplifyCategories } from 'amplify-cli-core';

/**
 * Post-Push update to Analytics resource. Notifies all dependent resources to update their metadata.
 * @param context Post-Push Amplify context
 * @returns
 */
export const invokePostPushAnalyticsUpdate = async (context: $TSContext):
  Promise<$TSContext> => {
  const updatedContext = (await context.amplify.invokePluginMethod(context, AmplifyCategories.ANALYTICS, undefined, 'analyticsPluginAPIPostPush', [context])) as $TSContext;
  return updatedContext;
};
