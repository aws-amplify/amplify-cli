/* eslint-disable spellcheck/spell-checker */
/**
 * wrapper functions to invoke functions exported by
 * analytics category. (primarily pinpoint api used by predictions for notifications)
 * @param {*} context
 */

import {
  $TSContext, IAmplifyResource, IAnalyticsResource,
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
    'analyticsAPIGetResources', [resourceProviderServiceName])) as Array<IAmplifyResource>;
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
    'analyticsAPICreateResource', [context, resourceProviderServiceName])) as IAmplifyResource;
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
  channel: NotificationChannels, enableChannel: boolean): Promise<AnalyticsCapabilityAPIResponse> => {
  const toggleNotificationsResponse = (await context.amplify.invokePluginMethod(context,
    'analytics', resourceProviderServiceName,
    'analyticsResourceToggleNotificationChannel', [context, resourceProviderServiceName, channel, enableChannel])) as AnalyticsCapabilityAPIResponse;
  return toggleNotificationsResponse;
};

/**
 * Notification Channels supported on Amplify Analytics category resources
 */
export enum NotificationChannels {
  APNS = 'APNS',
  FCM = 'FCM',
  EMAIL = 'Email',
  SMS = 'SMS',
  IN_APP_MSG = 'InAppMessaging',
  PUSH_NOTIFICATION = 'PushNotification'
}

/**
 * Analytics API response when client configures a capability ( e.g notifications )
 */
export interface AnalyticsCapabilityAPIResponse {
  resourceProviderServiceName: string, // Pinpoint of Kinesis
  capability: string, // Notifications
  subCapability?: string, // In-AppMessaging
  status: boolean, // true - successfully applied, false - failed to apply
  errorCode?: string,
  reasonMsg?: string, // In case of error, a user readable error string
}
