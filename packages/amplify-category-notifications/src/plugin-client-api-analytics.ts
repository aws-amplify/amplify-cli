/**
 * wrapper functions to invoke functions exported by
 * analytics category. (primarily pinpoint api used by predictions for notifications)
 * @param {*} context
 */

import {
  $TSContext,
  $TSMeta,
  AmplifyCategories,
  IAmplifyResource,
  IAnalyticsResource,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
} from '@aws-amplify/amplify-cli-core';

/**
 * Get all analytics resources. If resourceProviderService name is provided,
 * then only return resources matching the service.
 * @returns Array of resources in Analytics category (IAmplifyResource type)
 */
export const invokeAnalyticsAPIGetResources = async (
  context: $TSContext,
  resourceProviderServiceName?: string,
): Promise<Array<IAnalyticsResource>> =>
  (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIGetResources', [
    resourceProviderServiceName,
  ])) as Array<IAnalyticsResource>;

/**
 * Create an Analytics resource of the given provider type. e.g Pinpoint or Kinesis
 * @param context : CLI Context
 * @param resourceProviderServiceName AWS service which provides the Analytics category.
 * @returns Created amplify resource
 */
export const invokeAnalyticsAPICreateResource = async (
  context: $TSContext,
  resourceProviderServiceName: string,
): Promise<IAmplifyResource> =>
  (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPICreateResource', [
    context,
    resourceProviderServiceName,
  ])) as IAmplifyResource;

/**
 * Configure Analytics service to enable Notification channels to client.
 * Currently only Pinpoint supports notifications to the client.
 * @param context - Amplify CLI context
 * @param resourceProviderServiceName - Pinpoint or Kinesis
 * @param channel - Notification channel to be toggled
 * @param enableChannel - True - enable notification/ false - disable notification
 */
export const invokeAnalyticsResourceToggleNotificationChannel = async (
  context: $TSContext,
  resourceProviderServiceName: string,
  channel: NotificationChannels,
  enableChannel: boolean,
): Promise<IPluginCapabilityAPIResponse> =>
  (await context.amplify.invokePluginMethod(
    context,
    'analytics',
    resourceProviderServiceName,
    'analyticsPluginAPIToggleNotificationChannel',
    [resourceProviderServiceName, channel, enableChannel],
  )) as IPluginCapabilityAPIResponse;

/**
 * Get the last pushed time-stamp for the given resource from Analytics amplify-meta
 * @param amplifyMeta - in-core amplifyMeta
 * @param analyticsResourceName  - name of the Analytics resource to be queried
 * @returns timestamp of last push or undefined if not pushed
 */
export const invokeGetLastPushTimeStamp = async (amplifyMeta: $TSMeta, analyticsResourceName: string): Promise<string | undefined> =>
  amplifyMeta[AmplifyCategories.ANALYTICS][analyticsResourceName].lastPushTimeStamp;

/**
 * Push the analytics resource to create the Pinpoint resource.
 * @param context amplify CLI context
 * @param analyticsResourceName - Pinpoint resource name
 * @returns amplify push analytics response.
 */
export const invokeAnalyticsPush = async (context: $TSContext, analyticsResourceName: string): Promise<IPluginCapabilityAPIResponse> =>
  (await context.amplify.invokePluginMethod(context, 'analytics', analyticsResourceName, 'analyticsPluginAPIPush', [
    context,
  ])) as IPluginCapabilityAPIResponse;

/**
 * Checks if analytics pinpoint resource has in-app messaging policy
 */
export const invokeAnalyticsPinpointHasInAppMessagingPolicy = async (context: $TSContext): Promise<boolean> =>
  (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIPinpointHasInAppMessagingPolicy', [
    context,
  ])) as boolean;

/**
 * invoke analytics plugin migrations
 */
export const invokeAnalyticsMigrations = async (context: $TSContext): Promise<void> =>
  context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIMigrations', [context]);

/**
 * invoke analytics plugin migrations
 */
export const invokeAnalyticsGetPinpointRegionMapping = async (context: $TSContext): Promise<Record<string, string>> =>
  context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsGetPinpointRegionMapping', []);
