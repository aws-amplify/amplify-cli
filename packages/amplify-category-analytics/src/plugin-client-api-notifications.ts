import { $TSContext, AmplifyCategories, INotificationsResource, IPluginAPIResponse } from '@aws-amplify/amplify-cli-core';

/**
 * Get the notification resource config.
 * @returns Resource in Notifications category (IAmplifyResource type)
 */
export const invokeNotificationsAPIGetResource = async (context: $TSContext): Promise<INotificationsResource | undefined> => {
  const notificationsResource = await context.amplify.invokePluginMethod(
    context,
    AmplifyCategories.NOTIFICATIONS,
    undefined,
    'notificationsPluginAPIGetResource',
    [context],
  );
  return notificationsResource ? (notificationsResource as INotificationsResource) : undefined;
};

/**
 * Remove Notifications resource and all channels
 * @returns API response
 */
export const invokeNotificationsAPIRecursiveRemoveApp = async (context: $TSContext, appName: string): Promise<IPluginAPIResponse> =>
  (await context.amplify.invokePluginMethod(context, 'notifications', undefined, 'notificationsPluginAPIRemoveApp', [
    context,
    appName,
  ])) as IPluginAPIResponse;

/**
 * Checks if Pinpoint resource is in use by Notifications category
 * @param context amplify cli context
 * @param resourceName Pinpoint resource name
 * @returns true if Pinpoint resource is in use
 */
export const checkResourceInUseByNotifications = async (context: $TSContext, resourceName: string): Promise<boolean> => {
  const notificationsResource = await invokeNotificationsAPIGetResource(context);
  if (!notificationsResource?.resourceName) return false;
  return notificationsResource?.resourceName === resourceName;
};

/**
 * Returns all the channel names allowed in the Notifications category
 * @param context amplify cli context
 * @returns array of allowed channel names
 */
export const invokeNotificationsAPIGetAvailableChannelNames = async (context: $TSContext): Promise<string[]> =>
  (await context.amplify.invokePluginMethod(
    context,
    AmplifyCategories.NOTIFICATIONS,
    undefined,
    'notificationsAPIGetAvailableChannelNames',
    [context],
  )) as string[];
