/**
 * wrapper functions to invoke functions exported by
 * analytics category. (primarily pinpoint api used by predictions for notifications)
 * @param {*} context
 */

import {
  $TSContext, $TSMeta, AmplifyCategories, IAmplifyResource, IAnalyticsResource,
  IPluginCapabilityAPIResponse, NotificationChannels,
} from 'amplify-cli-core';

/**
* Get all analytics resources. If resourceProviderService name is provided,
* then only return resources matching the service.
* @returns Array of resources in Analytics category (IAmplifyResource type)
*/
export const invokeAnalyticsAPIGetResources = async (context: $TSContext, resourceProviderServiceName?: string):
  Promise<Array<IAnalyticsResource>> => {
  const analyticsResources = (await context.amplify.invokePluginMethod(context,
    'analytics', undefined,
    'analyticsPluginAPIGetResources', [resourceProviderServiceName])) as Array<IAnalyticsResource>;
  return analyticsResources;
};

/**
 * Create an Analytics resource of the given provider type. e.g Pinpoint or Kinesis
 * @param context : CLI Context
 * @param resourceProviderServiceName AWS service which provides the Analytics category.
 * @returns Created amplify resource
 */
export const invokeAnalyticsAPICreateResource = async (context: $TSContext, resourceProviderServiceName: string):
  Promise<IAmplifyResource> => {
  const analyticsResource = (await context.amplify.invokePluginMethod(context,
    'analytics', undefined,
    'analyticsPluginAPICreateResource', [context, resourceProviderServiceName])) as IAmplifyResource;
  return analyticsResource;
};

/**
 * Configure Analytics service to enable Notification channels to client.
 * Currently only Pinpoint supports notifications to the client.
 * @param context - Amplify CLI context
 * @param resourceProviderServiceName - Pinpoint or Kinesis
 * @param channel - Notification channel to be toggled
 * @param enableChannel - True - enable notification/ false - disable notification
 */
export const invokeAnalyticsResourceToggleNotificationChannel = async (context: $TSContext, resourceProviderServiceName: string,
  channel: NotificationChannels, enableChannel: boolean): Promise<IPluginCapabilityAPIResponse> => {
  const toggleNotificationsResponse = (await context.amplify.invokePluginMethod(context,
    'analytics', resourceProviderServiceName,
    'analyticsPluginAPIToggleNotificationChannel', [context, resourceProviderServiceName, channel, enableChannel])) as IPluginCapabilityAPIResponse;
  return toggleNotificationsResponse;
};

/**
 * Get the last pushed time-stamp for the given resource from Analytics amplify-meta
 * @param amplifyMeta - in-core amplifyMeta
 * @param analyticsResourceName  - name of the Analytics resource to be queried
 * @returns timestamp of last push or undefined if not pushed
 */
export const invokeGetLastPushTimeStamp = async (amplifyMeta: $TSMeta, analyticsResourceName: string):Promise<string|undefined> => {
  const analyticsLastPushTimeStamp = amplifyMeta[AmplifyCategories.ANALYTICS][analyticsResourceName].lastPushTimeStamp;
  return analyticsLastPushTimeStamp;
};

/**
 * Push the analytics resource to create the Pinpoint resource.
 * @param context amplify CLI context
 * @param analyticsResourceName - Pinpoint resource name
 * @returns amplify push analytics response.
 */
export const invokeAnalyticsPush = async (context: $TSContext, analyticsResourceName: string): Promise<IPluginCapabilityAPIResponse> => {
  const pushResponse = (await context.amplify.invokePluginMethod(context,
    'analytics', analyticsResourceName, 'analyticsPluginAPIPush', [context])) as IPluginCapabilityAPIResponse;
  return pushResponse;
};
