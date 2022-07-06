/* eslint-disable max-depth */
/* eslint-disable spellcheck/spell-checker */
import {
  AmplifyCategories, AmplifySupportedService, stateManager, IAmplifyResource,
  pathManager, $TSContext, IAnalyticsResource, PluginAPIError, NotificationChannels, IPluginCapabilityAPIResponse, $TSAny,
} from 'amplify-cli-core';

import { addResource } from './provider-utils/awscloudformation/index';
import { analyticsPush } from './commands/analytics';
import { invokeAuthPush } from './plugin-client-api-auth';
import { invokeNotificationsAPIGetAvailableChannelNames } from './plugin-client-api-notifications';

/**
 * Get all analytics resources. If resourceProviderService name is provided,
 * then only return resources matching the service.
 * @returns Array of resources in Analytics category (IAmplifyResource type)
 */
export const analyticsPluginAPIGetResources = (resourceProviderServiceName?: string, context?: $TSContext): Array<IAnalyticsResource> => {
  const resourceList: Array<IAnalyticsResource> = [];
  const amplifyMeta = (context) ? context.exeInfo.amplifyMeta : stateManager.getMeta();
  if (amplifyMeta && amplifyMeta[AmplifyCategories.ANALYTICS]) {
    const categoryResources = amplifyMeta[AmplifyCategories.ANALYTICS];
    Object.keys(categoryResources).forEach(resource => {
      // if resourceProviderService is provided, then only return resources provided by that service
      // else return all resources. e.g. Pinpoint, Kinesis
      if (!resourceProviderServiceName || categoryResources[resource].service === resourceProviderServiceName) {
        resourceList.push({
          category: AmplifyCategories.ANALYTICS,
          resourceName: resource,
          service: categoryResources[resource].service,
          region: categoryResources[resource]?.output?.Region,
          id: categoryResources[resource]?.output?.Id,
          output: categoryResources[resource]?.output,
        });
      }
    });
  }
  return resourceList;
};

/**
 * Create an Analytics resource of the given provider type. e.g Pinpoint or Kinesis
 * @param context : CLI Context
 * @param resourceProviderServiceName AWS service which provides the Analytics category.
 * @returns Created amplify resource
 */
export const analyticsPluginAPICreateResource = async (context: $TSContext, resourceProviderServiceName: string)
: Promise<IAmplifyResource> => {
  const resources : Array<IAmplifyResource> = analyticsPluginAPIGetResources(resourceProviderServiceName);
  if (resources.length > 0) {
    return resources[0];
  }
  // start add walkthrough for given service.
  const options = {
    service: resourceProviderServiceName,
    providerPlugin: 'awscloudformation',
  };
  const resourceName: string = await addResource(context, AmplifyCategories.ANALYTICS, resourceProviderServiceName);
  context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.ANALYTICS, resourceName, options);
  const output: IAmplifyResource = {
    category: AmplifyCategories.ANALYTICS,
    resourceName,
    service: resourceProviderServiceName,
  };
  return output;
};

/**
 * Configure Analytics service to enable Notification channels to client.
 * Currently only Pinpoint supports notifications to the client.
 * @param _ amplify cli context
 * @param resourceProviderServiceName - Pinpoint or Kinesis
 * @param channel - Notification channel to be toggled
 * @param enableChannel - True - enable notification/ false - disable notification
 */
export const analyticsPluginAPIToggleNotificationChannel = async (_: $TSContext, resourceProviderServiceName: string,
  channel: NotificationChannels, enableChannel: boolean): Promise<IPluginCapabilityAPIResponse> => {
  const response: IPluginCapabilityAPIResponse = {
    pluginName: AmplifyCategories.ANALYTICS,
    resourceProviderServiceName,
    capability: AmplifyCategories.NOTIFICATIONS,
    subCapability: channel,
    status: false,
  };

  if (!isSupportAnalytics(resourceProviderServiceName)) {
    response.status = false;
    response.errorCode = PluginAPIError.E_NO_SVC_PROVIDER;
    response.reasonMsg = `${resourceProviderServiceName} is not a provider for ${AmplifyCategories.ANALYTICS} category`;
    return response;
  }

  if (!isSupportNotifications(resourceProviderServiceName)) {
    response.status = false;
    response.errorCode = PluginAPIError.E_SVC_PROVIDER_NO_CAPABILITY;
    response.reasonMsg = `${AmplifyCategories.NOTIFICATIONS} not supported on ${AmplifyCategories.ANALYTICS} provider ${resourceProviderServiceName}`;
    return response;
  }

  // Get all resources belonging to the Analytics category and support Notifications capability
  const resources = analyticsPluginAPIGetResources(resourceProviderServiceName);
  if (!resources) {
    response.status = false;
    response.errorCode = PluginAPIError.E_NORES;
    response.reasonMsg = `No Resources Found for ${AmplifyCategories.ANALYTICS} category`;
    return response;
  }

  // Add notifications to the first pinpoint resource available
  const pinpointResource: IAmplifyResource = resources[0];
  if (enableChannel) {
    await pinpointAPIEnableNotificationChannel(pinpointResource, channel);
  } else {
    await pinpointAPIDisableNotificationChannel(pinpointResource, channel);
  }
  // Update amplify-meta.json

  response.status = true;
  return response;
};
/**
 * Push Analytics resource to the cloud. If the resourceProviderService exists in the configuration,
 * then this function will attempt to push to the cloud, else return failure.
 * @param context amplify cli context
 * @param resourceProviderServiceName - Pinpoint or Kinesis
 * @returns analytics push status
 */
export const analyticsPluginAPIPush = async (context: $TSContext, resourceProviderServiceName: string)
  : Promise<IPluginCapabilityAPIResponse> => {
  const pushResponse: IPluginCapabilityAPIResponse = {
    pluginName: AmplifyCategories.ANALYTICS,
    resourceProviderServiceName,
    capability: AmplifyCategories.NOTIFICATIONS,
    status: true,
  };

  const resources = analyticsPluginAPIGetResources(resourceProviderServiceName, context);
  if (!resources || resources.length === 0) {
    pushResponse.status = false;
    pushResponse.errorCode = PluginAPIError.E_NORES;
    pushResponse.reasonMsg = `No Resources of ${resourceProviderServiceName} found for ${AmplifyCategories.ANALYTICS} category`;
  } else {
    try {
      context.parameters.options.yes = true;
      context.exeInfo.inputParams = (context.exeInfo.inputParams) || {};
      context.exeInfo.inputParams.yes = true;
      await invokeAuthPush(context);
      await analyticsPush(context);
    } catch (err) {
      pushResponse.status = false;
      pushResponse.errorCode = PluginAPIError.E_PUSH_FAILED;
      pushResponse.reasonMsg = getErrorMessage(err);
    }
  }
  return pushResponse;
};

/**
 * Invoke post push hook for all dependent plugins ( e.g. notifications )
 */
export const analyticsPluginAPIPostPush = async (context: $TSContext) : Promise<$TSContext> => {
  const amplifyMeta = stateManager.getMeta();
  let pinpointNotificationsMeta; // build this to update amplify-meta and team-provider-info.json
  // update state only if analytics and notifications resources are present
  if (amplifyMeta
      && amplifyMeta[AmplifyCategories.ANALYTICS] && Object.keys(amplifyMeta[AmplifyCategories.ANALYTICS]).length > 0
      && amplifyMeta[AmplifyCategories.NOTIFICATIONS] && Object.keys(amplifyMeta[AmplifyCategories.NOTIFICATIONS]).length > 0) {
    // Fetch Analytics data from persistent amplify-meta.json. This is expected to be updated by the push operation.
    const analyticsResourceList:IAnalyticsResource[] = analyticsPluginAPIGetResources(AmplifySupportedService.PINPOINT);
    const notificationsResourceName = Object.keys(amplifyMeta[AmplifyCategories.NOTIFICATIONS])[0];
    // TBD: move to Notifications plugin
    // Populate the outputs for the notifications plugin.
    // Get analytics resource on which notifications are enabled
    const analyticsResource = analyticsResourceList.find(p => p.resourceName === notificationsResourceName);
    // Check if the resource is deployed to the cloud.
    if (analyticsResource && analyticsResource.output && analyticsResource.output.Id) {
      pinpointNotificationsMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName];
      pinpointNotificationsMeta.Name = (pinpointNotificationsMeta.Name) || analyticsResource.output.appName;
      pinpointNotificationsMeta.Id = analyticsResource.output.Id;
      pinpointNotificationsMeta.Region = analyticsResource.output.Region;
      // Update Notifications output and channel metadata
      pinpointNotificationsMeta.output.Id = analyticsResource.output.Id;
      pinpointNotificationsMeta.output.regulatedResourceName = analyticsResource.resourceName; // without the env suffix
      pinpointNotificationsMeta.output.region = analyticsResource.output.Region;

      amplifyMeta[AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName] = pinpointNotificationsMeta;
      // For each channel, update the ApplicationId into the Notification resource.
      const channelNames = await invokeNotificationsAPIGetAvailableChannelNames(context);
      for (const channelName of channelNames) {
        if (pinpointNotificationsMeta.output[channelName]) {
          pinpointNotificationsMeta.output[channelName].ApplicationId = analyticsResource.output.Id;
          pinpointNotificationsMeta.output[channelName].Name = analyticsResource.output.appName; // with the env suffix
        }
      }
      // update the notifications meta into the context
      amplifyMeta[AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName] = pinpointNotificationsMeta;
    }
  }

  if (amplifyMeta.analytics && context.exeInfo.amplifyMeta) {
    context.exeInfo.amplifyMeta.analytics = Object.assign(context.exeInfo.amplifyMeta.analytics, amplifyMeta.analytics);
  }
  if (amplifyMeta.notifications && context.exeInfo.amplifyMeta) {
    context.exeInfo.amplifyMeta.notifications = Object.assign(context.exeInfo.amplifyMeta.notifications, amplifyMeta.notifications);
  }
  // save updated notifications meta
  if (amplifyMeta) {
    stateManager.setMeta(undefined, amplifyMeta);
  }
  // save updated notifications team-provider-info.json
  if (pinpointNotificationsMeta) {
    await writeNotificationsTeamProviderInfo(context, pinpointNotificationsMeta);
  }

  // Generate frontend exports from currentMeta.
  // note:- Since this is postPush - currentMeta is the source of truth.
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  // note:-
  // The calling function is expected to
  // 1. Copy the team-providerinfo and backend-config file into currentCloudBackendDir
  // 2. Upload the currentCloudBackendDir to the cloud.
  return context;
};
// TBD move to notifications plugin
/**
 * Build team provider info for notifications
 * @param context
 * @param pinpointMeta ( for Id, Region and env specific resource name)
 */
const writeNotificationsTeamProviderInfo = async (context:$TSContext, pinpointMeta:$TSAny):Promise<void> => {
  const projectPath = pathManager.findProjectRoot();
  const { envName } = context.exeInfo.localEnvInfo;
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath) || {};
  teamProviderInfo[envName] = teamProviderInfo[envName] || {};
  teamProviderInfo[envName].categories = teamProviderInfo[envName].categories || {};
  teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS] = teamProviderInfo[envName]
    .categories[AmplifyCategories.NOTIFICATIONS] || {};
  teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT] = pinpointMeta
    ? {
      Name: pinpointMeta.Name,
      Id: pinpointMeta.Id,
      Region: pinpointMeta.Region,
    }
    : undefined;
  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
};

/**
 * Build the Notification channel's IAM policy name using the same shortID as the pinpoint policy name
 * */
const buildPolicyName = (channel: string, pinpointPolicyName: string): string => {
  // split the policy name by the prefix
  const shortId = pinpointPolicyName.split('pinpointPolicy')[1];
  return `pinpoint${channel}PolicyName${shortId}`;
};

// Capability: In the future replace with "capabilities" lookup
const isSupportNotifications = (resourceProviderName: string): boolean => (resourceProviderName === AmplifySupportedService.PINPOINT);

// Capability: In the future replace with "capabilities" lookup
const isSupportAnalytics = (resourceProviderName: string): boolean => (resourceProviderName === AmplifySupportedService.PINPOINT)
        || (resourceProviderName === AmplifySupportedService.KINESIS);

const pinpointAPIEnableNotificationChannel = (pinpointResource: IAmplifyResource, notificationChannel: NotificationChannels)
    : Promise<unknown> => {
  const pinpointResourceName = pinpointResource.resourceName;
  const projectPath = pathManager.findProjectRoot();
  const pinPointCFNInputParams = stateManager.getResourceParametersJson(projectPath, AmplifyCategories.ANALYTICS, pinpointResourceName);
  const uniqueChannelPolicyName = buildPolicyName(notificationChannel, pinPointCFNInputParams.pinpointPolicyName);
  switch (notificationChannel) {
    case NotificationChannels.IN_APP_MSG: {
      pinPointCFNInputParams[`pinpoint${notificationChannel}PolicyName`] = uniqueChannelPolicyName;
      stateManager.setResourceParametersJson(projectPath, AmplifyCategories.ANALYTICS, pinpointResourceName, pinPointCFNInputParams);
      break;
    }
    default: {
      throw Error(`Channel ${notificationChannel} is not supported on Analytics resource`);
    }
  }
  return pinPointCFNInputParams;
};

const pinpointAPIDisableNotificationChannel = (pinpointResource: IAmplifyResource, notificationChannel: NotificationChannels)
    : Promise<unknown> => {
  const pinpointResourceName = pinpointResource.resourceName;
  const projectPath = pathManager.findProjectRoot();
  const pinPointCFNInputParams = stateManager.getResourceParametersJson(projectPath, AmplifyCategories.ANALYTICS, pinpointResourceName);
  switch (notificationChannel) {
    case NotificationChannels.IN_APP_MSG: {
      // Remove IAM policy required for given channel from params.json
      delete pinPointCFNInputParams[`pinpoint${notificationChannel}PolicyName`];
      stateManager.setResourceParametersJson(projectPath, AmplifyCategories.ANALYTICS, pinpointResourceName, pinPointCFNInputParams);
      break;
    }
    default: {
      throw Error(`Channel ${notificationChannel} is not supported on Analytics resource`);
    }
  }
  return pinPointCFNInputParams;
};

/**
 * Helper: convert generic exception to reason message
 * note - To be replaced with generic error handler
 * @param error Error thrown by the library function
 * @returns error message extracted from Error
 */
export const getErrorMessage = (error: Error|string) : string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error) as string;
};
