/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable spellcheck/spell-checker */
import {
  AmplifyCategories, AmplifySupportedService, stateManager, IAmplifyResource, pathManager, $TSContext, IAnalyticsResource,
} from 'amplify-cli-core';
import { addResource } from './provider-utils/awscloudformation/index';

/**
 * Get all analytics resources. If resourceProviderService name is provided,
 * then only return resources matching the service.
 * @returns Array of resources in Analytics category (IAmplifyResource type)
 */
export const analyticsAPIGetResources = (resourceProviderServiceName?: string): Array<IAnalyticsResource> => {
  const resourceList: Array<IAnalyticsResource> = [];
  const amplifyMeta = stateManager.getMeta();
  if (amplifyMeta[AmplifyCategories.ANALYTICS]) {
    const categoryResources = amplifyMeta[AmplifyCategories.ANALYTICS];
    Object.keys(categoryResources).forEach(resource => {
      // if resourceProviderService is provided, then only return resources provided by that service
      // else return all resources. e.g. Pinpoint, Kinesis
      if (!resourceProviderServiceName || categoryResources[resource].service === resourceProviderServiceName) {
        console.log(`SACPCDEBUG: Found Resource for ${resourceProviderServiceName} : ${JSON.stringify(categoryResources[resource], null, 2)}`);
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
export const analyticsAPICreateResource = async (context: $TSContext, resourceProviderServiceName: string): Promise<IAmplifyResource> => {
  const resources : Array<IAmplifyResource> = analyticsAPIGetResources(resourceProviderServiceName);
  if (resources.length > 0) {
    console.log(`SACPCDEBUG : analyticsAPICreateResource :1: ${resourceProviderServiceName} resource found ${JSON.stringify(resources[0], null, 2)}`);
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
export const analyticsResourceToggleNotificationChannel = async (_: $TSContext, resourceProviderServiceName: string,
  channel: NotificationChannels, enableChannel: boolean): Promise<AnalyticsCapabilityAPIResponse> => {
  const response: AnalyticsCapabilityAPIResponse = {
    resourceProviderServiceName,
    capability: AmplifyCategories.NOTIFICATIONS,
    subCapability: channel,
    status: false,
  };

  if (!isSupportAnalytics(resourceProviderServiceName)) {
    response.status = false;
    response.errorCode = AnalyticsError.E_NO_SVC_PROVIDER;
    response.reasonMsg = `${resourceProviderServiceName} is not a provider for ${AmplifyCategories.ANALYTICS} category`;
    console.log('SACPCDEBUG: ToggleNotificationsChannel :1: Error: ', response.reasonMsg);
    return response;
  }

  if (!isSupportNotifications(resourceProviderServiceName)) {
    response.status = false;
    response.errorCode = AnalyticsError.E_PROVIDER_NOSUPPORT_CAPABILITY;
    response.reasonMsg = `${AmplifyCategories.NOTIFICATIONS} not supported on ${AmplifyCategories.ANALYTICS} provider ${resourceProviderServiceName}`;
    console.log('SACPCDEBUG: ToggleNotificationsChannel :2: Error: ', response.reasonMsg);
    return response;
  }

  // Get all resources belonging to the Analytics category and support Notifications capability
  const resources = analyticsAPIGetResources(resourceProviderServiceName);
  if (!resources) {
    response.status = false;
    response.errorCode = AnalyticsError.E_NORES;
    response.reasonMsg = `No Resources Found for ${AmplifyCategories.ANALYTICS} category`;
    console.log('SACPCDEBUG: ToggleNotificationsChannel :3: Error: ', response.reasonMsg);
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

/**
 * Analytics API Error codes.
 */
export const AnalyticsError = {
  E_NORES: 'E_NORES', // no resources found for given category/filter
  E_PROVIDER_NOSUPPORT_CAPABILITY: 'E_PROVIDER_NOSUPPORT_CAPABILITY', // Provider does not support capability
  E_NO_SVC_PROVIDER: 'E_NO_SVC_PROVIDER', // Given service is not a provider for a given category
};

/**
 * Notification Channels supported in Amplify
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
  console.log(`SACPCDEBUG:ANALYTICS: Enable ${notificationChannel} : pinpointAPIEnableNotificationChannel :1: ${JSON.stringify(pinPointCFNInputParams, null, 2)}`);
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
