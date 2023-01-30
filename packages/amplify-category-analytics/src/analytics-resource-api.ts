/* eslint-disable max-depth */
/* eslint-disable spellcheck/spell-checker */
import {
  AmplifyCategories, AmplifySupportedService, stateManager, IAmplifyResource,
  pathManager, $TSContext, IAnalyticsResource, PluginAPIError, NotificationChannels, IPluginCapabilityAPIResponse, $TSAny, AmplifyError,
} from 'amplify-cli-core';
import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { addResource } from './provider-utils/awscloudformation/index';
import { analyticsPush } from './commands/analytics';
import { invokeAuthPush } from './plugin-client-api-auth';
import { invokeNotificationsAPIGetAvailableChannelNames } from './plugin-client-api-notifications';
import { pinpointHasInAppMessagingPolicy } from './utils/pinpoint-helper';
import { getAnalyticsResources } from './utils/analytics-helper';
import { analyticsMigrations } from './migrations';

/**
 * Get all analytics resources. If resourceProviderService name is provided,
 * then only return resources matching the service.
 * @returns Array of resources in Analytics category (IAmplifyResource type)
 */
export const analyticsPluginAPIGetResources = (
  resourceProviderServiceName?: string,
  context?: $TSContext,
): Array<IAnalyticsResource> => getAnalyticsResources(context, resourceProviderServiceName);

/**
 * Create an Analytics resource of the given provider type. e.g Pinpoint or Kinesis
 * @param context : CLI Context
 * @param resourceProviderServiceName AWS service which provides the Analytics category.
 * @returns Created amplify resource
 */
export const analyticsPluginAPICreateResource = async (
  context: $TSContext,
  resourceProviderServiceName: string,
): Promise<IAmplifyResource> => {
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
 * @param resourceProviderServiceName - Pinpoint or Kinesis
 * @param channel - Notification channel to be toggled
 * @param enableChannel - True - enable notification/ false - disable notification
 */
export const analyticsPluginAPIToggleNotificationChannel = async (
  resourceProviderServiceName: string,
  channel: NotificationChannels,
  enableChannel: boolean,
): Promise<IPluginCapabilityAPIResponse> => {
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
    response.errorCode = PluginAPIError.E_NO_RESPONSE;
    response.reasonMsg = `No Resources Found for ${AmplifyCategories.ANALYTICS} category`;
    return response;
  }

  // Add notifications to the first pinpoint resource available
  const pinpointResource = resources[0];
  if (enableChannel) {
    await pinpointAPIEnableNotificationChannel(pinpointResource, channel);
  } else {
    await pinpointAPIDisableNotificationChannel(pinpointResource, channel);
  }

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
export const analyticsPluginAPIPush = async (
  context: $TSContext,
  resourceProviderServiceName: string,
): Promise<IPluginCapabilityAPIResponse> => {
  const pushResponse: IPluginCapabilityAPIResponse = {
    pluginName: AmplifyCategories.ANALYTICS,
    resourceProviderServiceName,
    capability: AmplifyCategories.NOTIFICATIONS,
    status: true,
  };

  const resources = analyticsPluginAPIGetResources(resourceProviderServiceName, context);
  if (!resources || resources.length === 0) {
    pushResponse.status = false;
    pushResponse.errorCode = PluginAPIError.E_NO_RESPONSE;
    pushResponse.reasonMsg = `No Resources of ${resourceProviderServiceName} found for ${AmplifyCategories.ANALYTICS} category`;
  } else {
    try {
      await invokeAuthPush(context);
      await analyticsPushYes(context);
    } catch (err) {
      pushResponse.status = false;
      pushResponse.errorCode = PluginAPIError.E_PUSH_FAILED;
      pushResponse.reasonMsg = err.message;
    }
  }
  return pushResponse;
};

/**
 * Execute analytics push command with force yes
 * @param {Object} context - The amplify context.
 */
export const analyticsPushYes = async (context: $TSContext): Promise<void> => {
  const exeInfoClone = { ...context?.exeInfo };
  const parametersClone = { ...context?.parameters };
  try {
    context.exeInfo = (context.exeInfo) || {};
    context.exeInfo.inputParams = (context.exeInfo.inputParams) || {};
    context.exeInfo.inputParams.yes = true; // force yes to avoid prompts
    context.parameters = (context.parameters) || {};
    context.parameters.options.yes = true;
    context.parameters.first = undefined;
    await analyticsPush(context);
  } finally {
    context.exeInfo = exeInfoClone;
    context.parameters = parametersClone;
  }
};

/**
 * Invoke post push hook for all dependent plugins ( e.g. notifications )
 */
export const analyticsPluginAPIPostPush = async (context: $TSContext) : Promise<$TSContext> => {
  const amplifyMeta = stateManager.getMeta();
  let pinpointNotificationsMeta; // build this to update amplify-meta and team-provider-info.json
  // update state only if analytics and notifications resources are present
  if (amplifyMeta?.[AmplifyCategories.ANALYTICS]
      && Object.keys(amplifyMeta[AmplifyCategories.ANALYTICS]).length > 0
      && amplifyMeta[AmplifyCategories.NOTIFICATIONS]
      && Object.keys(amplifyMeta[AmplifyCategories.NOTIFICATIONS]).length > 0) {
    // Fetch Analytics data from persistent amplify-meta.json. This is expected to be updated by the push operation.
    const analyticsResourceList = analyticsPluginAPIGetResources(AmplifySupportedService.PINPOINT);
    const notificationsResourceName = Object.keys(amplifyMeta[AmplifyCategories.NOTIFICATIONS])[0];

    // Populate the outputs for the notifications plugin.
    // Get analytics resource on which notifications are enabled
    const analyticsResource = analyticsResourceList.find(p => p.resourceName === notificationsResourceName);
    // Check if the resource is deployed to the cloud.
    if (analyticsResource?.output?.Id) {
      pinpointNotificationsMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName];
      pinpointNotificationsMeta.Name = (pinpointNotificationsMeta.Name) || analyticsResource.output.appName;
      pinpointNotificationsMeta.Id = analyticsResource.output.Id;
      pinpointNotificationsMeta.Region = analyticsResource.output.Region;
      // Update Notifications output and channel metadata
      pinpointNotificationsMeta.output = pinpointNotificationsMeta.output || {};
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
    await writeNotificationsTeamProviderInfo(pinpointNotificationsMeta);
  }

  // Generate frontend exports from currentMeta.
  // note:- Since this is postPush - currentMeta is the source of truth.
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  // note:-
  // The calling function is expected to
  // 1. Copy the team-provider-info and backend-config file into currentCloudBackendDir
  // 2. Upload the currentCloudBackendDir to the cloud.
  return context;
};

/**
 * Build team provider info for notifications
 * @param pinpointMeta ( for Id, Region and env specific resource name)
 */
const writeNotificationsTeamProviderInfo = async (pinpointMeta: $TSAny): Promise<void> => {
  if (!pinpointMeta) {
    return;
  }
  const envParamManager = getEnvParamManager();
  const params = {
    Name: pinpointMeta.Name,
    Id: pinpointMeta.Id,
    Region: pinpointMeta.Region,
  };
  // set params in the notifications and analytics resource param manager
  [AmplifyCategories.NOTIFICATIONS, AmplifyCategories.ANALYTICS]
    .map(category => envParamManager.getResourceParamManager(category, AmplifySupportedService.PINPOINT))
    .forEach(resourceParamManager => { resourceParamManager.setAllParams(params); });
};

/**
 * Build the Notification channel's IAM policy name using the same shortID as the pinpoint policy name
 **/
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

const pinpointAPIEnableNotificationChannel = (
  pinpointResource: IAmplifyResource,
  notificationChannel: NotificationChannels,
): Promise<unknown> => {
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
      throw new AmplifyError('ConfigurationError', {
        message: `Channel ${notificationChannel} is not supported on Analytics resource`,
        resolution: 'Use one of the supported channels',
      });
    }
  }
  return pinPointCFNInputParams;
};

const pinpointAPIDisableNotificationChannel = (
  pinpointResource: IAmplifyResource,
  notificationChannel: NotificationChannels,
): Promise<unknown> => {
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
      throw new AmplifyError('ConfigurationError', {
        message: `Channel ${notificationChannel} is not supported on Analytics resource`,
        resolution: 'Use one of the supported channels',
      });
    }
  }
  return pinPointCFNInputParams;
};

/**
 * Checks if analytics pinpoint resource has in-app messaging policy
 */
export const analyticsPluginAPIPinpointHasInAppMessagingPolicy = async (
  context: $TSContext,
): Promise<boolean> => pinpointHasInAppMessagingPolicy(context);

/**
 * Exposes the analytics migration API
 */
export const analyticsPluginAPIMigrations = (
  context: $TSContext,
): Promise<void> => analyticsMigrations(context);
