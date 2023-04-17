import { $TSContext, AmplifyCategories } from '@aws-amplify/amplify-cli-core';

/**
 * Post-Push update to Analytics resource. Notifies all dependent resources to update their metadata.
 * @param context Post-Push Amplify context
 */
export const invokePostPushAnalyticsUpdate = async (context: $TSContext): Promise<$TSContext> =>
  (await context.amplify.invokePluginMethod(context, AmplifyCategories.ANALYTICS, undefined, 'analyticsPluginAPIPostPush', [
    context,
  ])) as $TSContext;
