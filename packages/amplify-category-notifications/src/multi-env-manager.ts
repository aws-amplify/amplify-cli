import {
  $TSAny,
  $TSContext,
  stateManager,
  AmplifyCategories,
  AmplifySupportedService,
  IAnalyticsResource,
  $TSMeta,
  AmplifyError,
} from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import { printer } from '@aws-amplify/amplify-prompts';
import * as authHelper from './auth-helper';
import {
  ensurePinpointApp,
  getPinpointAppFromAnalyticsOutput,
  getPinpointAppStatus,
  getPinpointClient,
  IPinpointAppStatus,
  isPinpointDeploymentRequired,
  pushAuthAndAnalyticsPinpointResources,
  scanCategoryMetaForPinpoint,
} from './pinpoint-helper';
import * as notificationManager from './notifications-manager';
import { IChannelAPIResponse } from './channel-types';
import { generateMetaFromConfig } from './notifications-api';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { PinpointName } from './pinpoint-name';
import { writeData } from './multi-env-manager-utils';
import {
  viewShowInlineModeInstructionsFail,
  viewShowInlineModeInstructionsStart,
  viewShowInlineModeInstructionsStop,
} from './display-utils';
import { getAvailableChannels } from './notifications-backend-cfg-channel-api';
import { DeleteAppCommand } from '@aws-sdk/client-pinpoint';
/**
 * Create Pinpoint resource in Analytics, Create Pinpoint Meta for Notifications category and
 * update configuration for enabling/disabling channels.
 * note:- If Pinpoint resource does not exist, it will run the analytics walkthrough to allocate
 * a new Pinpoint resource.
 * @param context amplify cli context
 * @returns Pinpoint notifications metadata
 */
export const initEnv = async (context: $TSContext): Promise<$TSAny> => {
  const pinpointNotificationsMeta = await constructPinpointNotificationsMeta(context);
  if (pinpointNotificationsMeta) {
    // remove this line after init and init-push are separated.
    const channelAPIResponseList = await pushChanges(context, pinpointNotificationsMeta);
    if (channelAPIResponseList && channelAPIResponseList.length > 0) {
      for (const channelAPIResponse of channelAPIResponseList) {
        await writeData(context, channelAPIResponse);
      }
    } else {
      // looks like channels are enabled but also deployed hence no need to deploy again.
      // Only update notifications (amplifyMeta and backendConfig) with current pinpoint meta
      if (pinpointNotificationsMeta.output?.Id) {
        const { envName } = context.exeInfo.localEnvInfo;
        const regulatedResourceName = PinpointName.extractResourceName(pinpointNotificationsMeta.Name, envName);
        // update amplifyMeta.notifications from current pinpoint meta
        context.exeInfo.amplifyMeta.notifications = {
          [regulatedResourceName]: {
            Id: pinpointNotificationsMeta.output.Id,
            ResourceName: regulatedResourceName,
            Name: pinpointNotificationsMeta.Name,
            Region: pinpointNotificationsMeta.Region,
            service: pinpointNotificationsMeta.service,
            output: pinpointNotificationsMeta.output,
            lastPushTimeStamp: pinpointNotificationsMeta.lastPushTimeStamp,
          },
        };
        // update backendConfig with current pinpoint meta
        const availableChannels = getAvailableChannels();
        const enabledChannels = availableChannels.filter((channelName) => channelName in pinpointNotificationsMeta.output);
        context.exeInfo.backendConfig.notifications = context.exeInfo.backendConfig.notifications || {};
        context.exeInfo.backendConfig.notifications = {
          [regulatedResourceName]: {
            service: pinpointNotificationsMeta.service,
            channels: enabledChannels,
          },
        };
      }
      // only save the state for pull
      await writeData(context, undefined);
    }
  }
  return pinpointNotificationsMeta;
};

const getAnalyticsResourcesFromMeta = (amplifyMeta: $TSMeta, supportedServiceName: string): IAnalyticsResource[] => {
  const resourceList: IAnalyticsResource[] = [];
  if (amplifyMeta[AmplifyCategories.ANALYTICS]) {
    const categoryResources = amplifyMeta[AmplifyCategories.ANALYTICS];
    Object.keys(categoryResources).forEach((resource) => {
      // if resourceProviderService is provided, then only return resources provided by that service
      // else return all resources. e.g. Pinpoint, Kinesis
      if (!supportedServiceName || categoryResources[resource].service === supportedServiceName) {
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
 * Get Pinpoint resource metadata from Analytics category metadata
 * Currently we only support one Pinpoint resource in Analytics
 * @param amplifyMeta amplify metadata
 * @returns Pinpoint App metadata from Analytics or undefined if no Pinpoint resource found.
 */
const getPinpointAppFromAnalyticsMeta = (amplifyMeta: $TSMeta): Partial<ICategoryMeta> | undefined => {
  // Get PinpointApp from Analytics
  const resources: IAnalyticsResource[] = getAnalyticsResourcesFromMeta(amplifyMeta, AmplifySupportedService.PINPOINT);
  if (resources.length <= 0) {
    return undefined;
  }
  const pinpointAppMeta: Partial<ICategoryMeta> = getPinpointAppFromAnalyticsOutput(resources[0]);
  return pinpointAppMeta;
};

const constructPinpointNotificationsMeta = async (context: $TSContext): Promise<$TSAny> => {
  let pinpointApp: $TSAny;
  let serviceBackendConfig: $TSAny;
  let pinpointNotificationsMeta: $TSAny;

  // For pull we have to get the pinpoint application for notifications category
  // from cloud meta and as no new resources are created during pull, we should not look for
  // Pinpoint app in analytics category.
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands?.[0] === 'pull');
  const currentAmplifyMeta = stateManager.getCurrentMeta(undefined, {
    throwIfNotExist: false,
  });

  if (isPulling && currentAmplifyMeta) {
    const currentNotificationsMeta = currentAmplifyMeta[AmplifyCategories.NOTIFICATIONS];

    // We only support single Pinpoint across notifications and analytics categories
    if (currentNotificationsMeta && Object.keys(currentNotificationsMeta).length > 0) {
      const pinpointResource = _.get(currentNotificationsMeta, Object.keys(currentNotificationsMeta)[0], undefined);
      // if pinpoint resource ID is not found in Notifications, we will ge it from the Analytics category
      if (!pinpointResource.output.Id) {
        const analyticsPinpointApp: Partial<ICategoryMeta> | undefined = getPinpointAppFromAnalyticsMeta(currentAmplifyMeta);
        // eslint-disable-next-line max-depth
        if (analyticsPinpointApp) {
          pinpointResource.output.Id = analyticsPinpointApp.Id;
          pinpointResource.output.Region = analyticsPinpointApp.Region;
          pinpointResource.output.Name = analyticsPinpointApp.Name;
          pinpointResource.ResourceName = analyticsPinpointApp.regulatedResourceName;
        }
      }

      if (!pinpointResource.output.Id) {
        throw new AmplifyError('ResourceNotReadyError', {
          message: 'Pinpoint resource ID not found.',
          resolution: 'Run "amplify add analytics" to create a new Pinpoint resource.',
        });
      }

      pinpointApp = {
        Id: pinpointResource.output.Id,
      };
      pinpointApp.Name = pinpointResource.output.Name || pinpointResource.output.appName;
      pinpointApp.Region = pinpointResource.output.Region;
      pinpointApp.lastPushTimeStamp = pinpointResource.lastPushTimeStamp;
    }
  }

  const { teamProviderInfo, localEnvInfo, amplifyMeta, backendConfig } = context.exeInfo;

  const { envName } = localEnvInfo;

  if (teamProviderInfo?.[envName]?.categories?.[AmplifyCategories.NOTIFICATIONS]?.[AmplifySupportedService.PINPOINT]?.Id) {
    pinpointApp = teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
  }

  let isMobileHubMigrated = false;

  if (!pinpointApp) {
    const analyticsMeta = amplifyMeta[AmplifyCategories.ANALYTICS];

    // Check if meta contains a resource without provider, so it is a migrated one.
    if (analyticsMeta) {
      for (const resourceName of Object.keys(analyticsMeta)) {
        const resource = analyticsMeta[resourceName];

        if (resource.mobileHubMigrated === true) {
          isMobileHubMigrated = true;
          break;
        }
      }
    }

    if (!isMobileHubMigrated) {
      pinpointApp = scanCategoryMetaForPinpoint(analyticsMeta, undefined);
    }
  }

  // Special case, in case of mobile hub migrated projects there is no backend config, so skipping the next parts
  // as all data is present in the service, no need for any updates.

  if (!isMobileHubMigrated) {
    if (backendConfig[AmplifyCategories.NOTIFICATIONS]) {
      const categoryConfig = backendConfig[AmplifyCategories.NOTIFICATIONS];
      const resources = Object.keys(categoryConfig);
      for (const resource of resources) {
        serviceBackendConfig = categoryConfig[resource];
        if (serviceBackendConfig.service === AmplifySupportedService.PINPOINT) {
          serviceBackendConfig.resourceName = resource;
          break;
        }
      }
    }

    if (pinpointApp && (!isPulling || (isPulling && currentAmplifyMeta[AmplifyCategories.NOTIFICATIONS]))) {
      await notificationManager.pullAllChannels(context, pinpointApp);
      pinpointNotificationsMeta = {
        Name: pinpointApp.Name,
        service: AmplifySupportedService.PINPOINT,
        output: pinpointApp,
        lastPushTimeStamp: pinpointApp.lastPushTimeStamp,
      };
      // output must not contain the lastPushTimeStamp of the Pinpoint resource.
      delete pinpointNotificationsMeta.output.lastPushTimeStamp;
    }

    if (serviceBackendConfig) {
      if (pinpointNotificationsMeta) {
        pinpointNotificationsMeta.channels = serviceBackendConfig.channels;
      } else {
        return generateMetaFromConfig(envName, serviceBackendConfig);
      }
    }
    return pinpointNotificationsMeta;
  }

  return pinpointNotificationsMeta;
};

/**
 * Remove all Notifications resources from Pinpoint app for the given env
 * @param context amplify cli context
 * @param envName environment in which amplify cli is executed
 * @returns Pinpoint Client response
 */
export const deletePinpointAppForEnv = async (context: $TSContext, envName: string): Promise<$TSAny> => {
  let pinpointApp: $TSAny;
  const teamProviderInfo = context.amplify.getEnvDetails();

  if (teamProviderInfo?.[envName]?.categories?.[AmplifyCategories.NOTIFICATIONS]?.[AmplifySupportedService.PINPOINT]) {
    pinpointApp = teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
  }

  if (pinpointApp) {
    const params = {
      ApplicationId: pinpointApp.Id,
    };
    const pinpointClient = await getPinpointClient(context, AmplifyCategories.NOTIFICATIONS, 'delete', envName);

    await authHelper.deleteRolePolicy(context);
    try {
      await pinpointClient.send(new DeleteAppCommand(params));
      printer.success(`Successfully deleted Pinpoint project: ${pinpointApp.Id}`);
    } catch (err) {
      // awscloudformation might have already removed the pinpoint project
      if (err.code === 'NotFoundException') {
        printer.warn(`${pinpointApp.Id}: not found`);
      } else {
        printer.error(`Failed to delete Pinpoint project: ${pinpointApp.Id}`);
        throw err;
      }
    }
  }
  return undefined;
};

const buildPinpointInputParameters = (context: $TSContext): $TSAny => {
  const { backendConfig } = context.exeInfo;

  // for pull and env add the backend-config may not be configured yet
  if (!backendConfig) {
    return buildPinpointInputParametersFromAmplifyMeta(context);
  }

  return buildPinpointInputParametersFromBackendConfig(context);
};

/**
 * A channel needs to be enabled if config state is enabled and meta state is not enabled.
 * This function needs to handle pull, push and env add.
 * @param pinpointInputParams Channel configuration parameters acquired through command-line , config or meta (only for env-add)
 * @param pinpointNotificationsMeta amplifyMeta for the channel
 * @returns array of channels to be enabled/disabled in the Pinpoint app.
 */
const getEnabledDisabledChannelsFromConfigAndMeta = (
  pinpointInputParams: $TSAny,
  pinpointNotificationsMeta: $TSAny,
): { channelsToEnable: string[]; channelsToDisable: string[] } => {
  const channelsToEnable: Array<string> = [];
  const channelsToDisable: Array<string> = [];
  // const channelsToUpdate = [];
  const availableChannels = getAvailableChannels();

  availableChannels.forEach((channel) => {
    let isCurrentlyEnabled = false;
    let needToBeEnabled = false;
    if (pinpointNotificationsMeta.output?.Id && pinpointNotificationsMeta.output[channel]?.Enabled) {
      isCurrentlyEnabled = true;
    }

    if (pinpointNotificationsMeta.channels?.includes(channel)) {
      needToBeEnabled = true;
    }
    if (pinpointInputParams?.[channel] && Object.prototype.hasOwnProperty.call(pinpointInputParams[channel], 'Enabled')) {
      needToBeEnabled = pinpointInputParams[channel].Enabled;
    }

    if (isCurrentlyEnabled && !needToBeEnabled) {
      channelsToDisable.push(channel);
    } else if (!isCurrentlyEnabled && needToBeEnabled) {
      channelsToEnable.push(channel);
    }
  });
  return { channelsToEnable, channelsToDisable };
};

/**
 * Check if the enabled channel requires a Pinpoint resource.
 * Invoke Analytics flow if resource is not available.
 * @param context amplify cli context
 * @param channelName channel to be enabled
 * @param pinpointAppStatus Deployment status of the Pinpoint resource
 */
export const checkAndCreatePinpointApp = async (
  context: $TSContext,
  channelName: string,
  pinpointAppStatus: IPinpointAppStatus,
): Promise<IPinpointAppStatus> => {
  let updatedPinpointAppStatus = pinpointAppStatus;
  if (isPinpointDeploymentRequired(channelName, pinpointAppStatus)) {
    await viewShowInlineModeInstructionsStart(channelName);
    try {
      // updates the pinpoint app status
      updatedPinpointAppStatus = await pushAuthAndAnalyticsPinpointResources(context, pinpointAppStatus);
      updatedPinpointAppStatus = await ensurePinpointApp(context, updatedPinpointAppStatus);
      await viewShowInlineModeInstructionsStop(channelName);
    } catch (err) {
      // if the push fails, the user will be prompted to deploy the resource manually
      await viewShowInlineModeInstructionsFail(channelName, err);
      throw new AmplifyError(
        'DeploymentError',
        {
          message: 'Failed to deploy Auth and Pinpoint resources.',
          resolution: 'Deploy the Auth and Pinpoint resources manually.',
        },
        err,
      );
    }
  }

  return updatedPinpointAppStatus;
};

const pushChanges = async (context: $TSContext, pinpointNotificationsMeta: $TSAny): Promise<Array<IChannelAPIResponse | undefined>> => {
  let pinpointInputParams: $TSAny;

  if (context?.exeInfo?.inputParams?.categories?.[AmplifyCategories.NOTIFICATIONS]?.[AmplifySupportedService.PINPOINT]) {
    pinpointInputParams = context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
    context.exeInfo.pinpointInputParams = pinpointInputParams;
  }

  const pinpointAppStatus = await getPinpointAppStatus(
    context,
    context.exeInfo.amplifyMeta,
    pinpointNotificationsMeta,
    context.exeInfo.localEnvInfo.envName,
  );

  await ensurePinpointApp(context, pinpointNotificationsMeta, pinpointAppStatus, context.exeInfo.localEnvInfo.envName);
  const results: Array<IChannelAPIResponse | undefined> = [];

  /**
   * per current understanding, the following code is only executed when the user is in pull and env add states.
   * In the Pull/Env add case input params are empty and need to be initialized from the context.exeInfo.backendConfig
   */
  if (!pinpointInputParams && context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    pinpointInputParams = buildPinpointInputParameters(context);
  }

  const { channelsToEnable, channelsToDisable } = getEnabledDisabledChannelsFromConfigAndMeta(
    pinpointInputParams,
    pinpointNotificationsMeta,
  );

  for (const channel of channelsToEnable) {
    await checkAndCreatePinpointApp(context, channel, pinpointAppStatus);
    results.push(await notificationManager.enableChannel(context, channel));
  }

  for (const channel of channelsToDisable) {
    await checkAndCreatePinpointApp(context, channel, pinpointAppStatus);
    results.push(await notificationManager.disableChannel(context, channel));
  }

  return results;
};

/**
 *  migrate Pinpoint resource for older CLI versions
 * @param context amplify cli context
 */
export const migrate = async (context: $TSContext): Promise<void> => {
  const migrationInfo = extractMigrationInfo(context);
  fillBackendConfig(context, migrationInfo);
  fillTeamProviderInfo(context, migrationInfo);
};

const extractMigrationInfo = (context: $TSContext): $TSAny => {
  let migrationInfo: $TSAny;
  const { amplifyMeta, localEnvInfo } = context.migrationInfo;
  if (amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const resources = Object.keys(categoryMeta);
    for (const service of resources) {
      const serviceMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS][service];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT) {
        migrationInfo = {};
        migrationInfo.envName = localEnvInfo.envName;
        migrationInfo.serviceName = service;
        migrationInfo.service = serviceMeta.service;
        migrationInfo.output = serviceMeta.output;
        break;
      }
    }
  }

  if (migrationInfo?.output?.Id) {
    migrationInfo.Id = migrationInfo.output.Id;
    migrationInfo.Name = migrationInfo.output.Name;
    migrationInfo.Region = migrationInfo.output.Region;
    migrationInfo.channels = [];
    const availableChannels = getAvailableChannels();
    availableChannels.forEach((channel) => {
      if (migrationInfo.output[channel]?.Enabled) {
        migrationInfo.channels.push(channel);
      }
    });
  }

  return migrationInfo;
};

const fillBackendConfig = (context: $TSContext, migrationInfo: $TSAny): void => {
  if (migrationInfo) {
    const backendConfig: $TSAny = {};
    backendConfig[migrationInfo.serviceName] = {
      service: migrationInfo.service,
      channels: migrationInfo.channels,
    };
    Object.assign(context.migrationInfo.backendConfig[AmplifyCategories.NOTIFICATIONS]!, backendConfig);
  }
};

const fillTeamProviderInfo = (context: $TSContext, migrationInfo: $TSAny): void => {
  if (migrationInfo?.Id) {
    const categoryTeamInfo: $TSAny = {};
    categoryTeamInfo[AmplifyCategories.NOTIFICATIONS] = {};
    categoryTeamInfo[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT] = {
      Name: migrationInfo.Name,
      Id: migrationInfo.Id,
      Region: migrationInfo.Region,
    };

    const { teamProviderInfo } = context.migrationInfo;
    teamProviderInfo[migrationInfo.envName] = teamProviderInfo[migrationInfo.envName] || {};

    teamProviderInfo[migrationInfo.envName].categories = teamProviderInfo[migrationInfo.envName].categories || {};

    Object.assign(teamProviderInfo[migrationInfo.envName].categories!, categoryTeamInfo);
  }
};

const buildPinpointInputParametersFromAmplifyMeta = (context: $TSContext): Record<string, $TSAny> => {
  const { envName } = context.exeInfo.localEnvInfo;
  const { amplifyMeta } = context.exeInfo;
  const pinpointInputParameters: Record<string, $TSAny> = { envName };
  const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  const availableChannels = getAvailableChannels();
  if (!categoryMeta) {
    return pinpointInputParameters;
  }

  const pinpointResourceName = Object.keys(categoryMeta).find((k) => categoryMeta[k].service === AmplifySupportedService.PINPOINT);
  if (pinpointResourceName) {
    pinpointInputParameters.service = AmplifySupportedService.PINPOINT;
    if (categoryMeta[pinpointResourceName].output) {
      for (const channelName of availableChannels) {
        if (channelName in categoryMeta[pinpointResourceName].output) {
          pinpointInputParameters[channelName] = categoryMeta[pinpointResourceName][channelName];
        }
      }
    }
  }

  return pinpointInputParameters;
};

const buildPinpointInputParametersFromBackendConfig = (context: $TSContext): Record<string, $TSAny> => {
  const { backendConfig } = context.exeInfo;
  const { envName } = context.exeInfo.localEnvInfo;
  const pinpointInputParameters: Record<string, $TSAny> = { envName };
  const categoryConfig = backendConfig[AmplifyCategories.NOTIFICATIONS];
  const resourceNames = Object.keys(categoryConfig);
  const availableChannels = getAvailableChannels();
  for (const resourceName of resourceNames) {
    const resource = categoryConfig[resourceName];
    if (resource.service === AmplifySupportedService.PINPOINT) {
      for (const channelName of availableChannels) {
        if (resource.channels.includes(channelName)) {
          pinpointInputParameters[channelName] = { Enabled: true };
        }
      }
      return pinpointInputParameters;
    }
  }
  return pinpointInputParameters;
};
