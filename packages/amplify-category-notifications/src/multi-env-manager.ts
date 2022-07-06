/* eslint-disable max-depth */
/* eslint-disable spellcheck/spell-checker */
import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, stateManager, AmplifyCategories, AmplifySupportedService, IAnalyticsResource, $TSMeta,
} from 'amplify-cli-core';
import _ from 'lodash';
import { printer } from 'amplify-prompts';
import { ensureEnvParamManager, getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import * as authHelper from './auth-helper';
import {
  ensurePinpointApp,
  getPinpointAppFromAnalyticsOutput,
  getPinpointAppStatus,
  getPinpointClient,
  IPinpointAppStatus,
  isPinpointAppDeployed,
  isPinpointDeploymentRequired,
  pushAuthAndAnalyticsPinpointResources,
  scanCategoryMetaForPinpoint,
} from './pinpoint-helper';
import * as notificationManager from './notifications-manager';
import { ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
import { Notifications } from './notifications-api';
import { ICategoryMeta, IPinpointAppMeta } from './notifications-amplify-meta-types';
import { PinpointName } from './pinpoint-name';
import {
  viewShowInlineModeInstructionsStart, viewShowInlineModeInstructionsStop, viewShowInlineModeInstructionsFail, viewShowDeferredModeInstructions,
} from './commands/notifications/add';

/**
 * Create Pinpoint resource in Analytics, Create Pinpoint Meta for Notifications category and
 * update configuration for enabling/disabling channels.
 * note:- If Pinpoint resource doesnt exist, it will run the analytics walkthrough to allocate
 * a new Pinpoint resource.
 * @param context amplify cli context
 * @returns Pinpoint notifications metadata
 */
export const initEnv = async (context: $TSContext):Promise<$TSAny> => {
  const pinpointNotificationsMeta:IPinpointAppMeta = await constructPinpointNotificationsMeta(context);
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
      if (pinpointNotificationsMeta.output && pinpointNotificationsMeta.output.Id) {
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
        const availableChannels = Notifications.ChannelCfg.getAvailableChannels();
        const enabledChannels = availableChannels.filter(channelName => channelName in pinpointNotificationsMeta.output);
        context.exeInfo.backendConfig.notifications = (context.exeInfo.backendConfig.notifications) || {};
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

const getAnalyticsResourcesFromMeta = (amplifyMeta :$TSMeta, supportedServiceName: string):IAnalyticsResource[] => {
  const resourceList: IAnalyticsResource[] = [];
  if (amplifyMeta[AmplifyCategories.ANALYTICS]) {
    const categoryResources = amplifyMeta[AmplifyCategories.ANALYTICS];
    Object.keys(categoryResources).forEach(resource => {
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
const getPinpointAppFromAnalyticsMeta = (amplifyMeta: $TSMeta): Partial<ICategoryMeta>|undefined => {
  // Get PinpointApp from Analytics
  const resources: IAnalyticsResource[] = getAnalyticsResourcesFromMeta(amplifyMeta, AmplifySupportedService.PINPOINT);
  if (resources.length <= 0) {
    return undefined;
  }
  const pinpointAppMeta: Partial<ICategoryMeta> = getPinpointAppFromAnalyticsOutput(resources[0]);
  return pinpointAppMeta;
};

const constructPinpointNotificationsMeta = async (context: $TSContext) : Promise<$TSAny> => {
  let pinpointApp: $TSAny;
  let serviceBackendConfig: $TSAny;
  let pinpointNotificationsMeta: $TSAny;

  // For pull we have to get the pinpoint application for notifications category
  // from cloud meta and as no new resources are created during pull, we should not look for
  // Pinpoint app in analytics category.
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');

  if (isPulling) {
    const currentAmplifyMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentAmplifyMeta) {
      const currentNotificationsMeta = currentAmplifyMeta[AmplifyCategories.NOTIFICATIONS];

      // We only support single Pinpoint across notifications and analytics categories
      if (currentNotificationsMeta && Object.keys(currentNotificationsMeta).length > 0) {
        const pinpointResource = _.get(currentNotificationsMeta, Object.keys(currentNotificationsMeta)[0], undefined);
        // if pinpoint resource ID is not found in Notifications, we will ge it from the Analytics category
        if (!(pinpointResource.output.Id)) {
          const analyticsPinpointApp: Partial<ICategoryMeta>|undefined = getPinpointAppFromAnalyticsMeta(currentAmplifyMeta);
          if (analyticsPinpointApp) {
            pinpointResource.output.Id = analyticsPinpointApp.Id;
            pinpointResource.output.Region = analyticsPinpointApp.Region;
            pinpointResource.output.Name = analyticsPinpointApp.Name;
            pinpointResource.ResourceName = analyticsPinpointApp.regulatedResourceName;
          }
        }

        if (!pinpointResource.output.Id) {
          throw new Error('Pinpoint resource ID not found - please run "amplify add analytics" to create a new Pinpoint resource');
        }

        pinpointApp = {
          Id: pinpointResource.output.Id,
        };
        pinpointApp.Name = pinpointResource.output.Name || pinpointResource.output.appName;
        pinpointApp.Region = pinpointResource.output.Region;
      }
    }
  }

  const {
    teamProviderInfo, localEnvInfo, amplifyMeta, backendConfig,
  } = context.exeInfo;

  const { envName } = localEnvInfo;

  if (
    teamProviderInfo
    && teamProviderInfo[envName]
    && teamProviderInfo[envName].categories
    && teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS]
    && teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT]
    && teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT].Id
  ) {
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
    // const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
    // const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
    if (backendConfig[AmplifyCategories.NOTIFICATIONS]) {
      const categoryConfig = backendConfig[AmplifyCategories.NOTIFICATIONS];
      const resources = Object.keys(categoryConfig);
      for (let i = 0; i < resources.length; i++) {
        serviceBackendConfig = categoryConfig[resources[i]];
        if (serviceBackendConfig.service === AmplifySupportedService.PINPOINT) {
          serviceBackendConfig.resourceName = resources[i];
          break;
        }
      }
    }

    if (pinpointApp) {
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
        pinpointNotificationsMeta = Notifications.generateMetaFromConfig(envName, serviceBackendConfig);
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
export const deletePinpointAppForEnv = async (context: $TSContext, envName: string) : Promise<$TSAny> => {
  let pinpointApp: $TSAny;
  const teamProviderInfo = context.amplify.getEnvDetails();

  if (
    teamProviderInfo
    && teamProviderInfo[envName]
    && teamProviderInfo[envName].categories
    && teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS]
    && teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT]
  ) {
    pinpointApp = teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
  }

  if (pinpointApp) {
    const params = {
      ApplicationId: pinpointApp.Id,
    };
    const pinpointClient = await getPinpointClient(context, 'delete', envName);

    await authHelper.deleteRolePolicy(context);
    return pinpointClient
      .deleteApp(params)
      .promise()
      .then(() => {
        context.print.success(`Successfully deleted Pinpoint project: ${pinpointApp.Id}`);
      })
      .catch((err : $TSAny) => {
        // awscloudformation might have already removed the pinpoint project
        if (err.code === 'NotFoundException') {
          context.print.warning(`${pinpointApp.Id}: not found`);
        } else {
          context.print.error(`Failed to delete Pinpoint project: ${pinpointApp.Id}`);
          throw err;
        }
      });
  }
  return undefined;
};

const buildPinpointInputParametersFromAmplifyMeta = (context : $TSContext): $TSAny => {
  const { envName } = context.exeInfo.localEnvInfo;
  const { amplifyMeta } = context.exeInfo;
  const { backendConfig } = context.exeInfo;
  const pinpointInputParameters : Record<string, $TSAny> = { envName };

  // for pull and env add the backend-config may not be configured yet
  if (!backendConfig) {
    const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const availableChannels = Notifications.ChannelCfg.getAvailableChannels();
    if (categoryMeta) {
      const resourceNames = Object.keys(categoryMeta);
      for (const resourceName of resourceNames) {
        const resource = categoryMeta[resourceName];
        if (resource.service === AmplifySupportedService.PINPOINT) {
          pinpointInputParameters.service = AmplifySupportedService.PINPOINT;
          if (resource.output) {
            for (const channelName of availableChannels) {
              if (channelName in resource.output) {
                pinpointInputParameters[channelName] = resource[channelName];
              }
            }
          }
          break;
        }
      }
    }
    return pinpointInputParameters;
  }
  const categoryConfig = backendConfig[AmplifyCategories.NOTIFICATIONS];
  const resourceNames = Object.keys(categoryConfig);
  const availableChannels = Notifications.ChannelCfg.getAvailableChannels();
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
/**
 * A channel needs to be enabled if config state is enabled and meta state is not enabled.
 * This function needs to handle pull, push and env add.
 * @param pinpointInputParams Channel configuration parameters acquired through command-line , config or meta (only for env-add)
 * @param pinpointNotificationsMeta amplifyMeta for the channel
 * @returns array of channels to be enabled/disabled in the Pinpoint app.
 */
const getEnabledDisabledChannelsFromConfigAndMeta = (pinpointInputParams: $TSAny, pinpointNotificationsMeta: $TSAny)
:{channelsToEnable: string[], channelsToDisable: string[]} => {
  const channelsToEnable : Array<string> = [];
  const channelsToDisable : Array<string> = [];
  // const channelsToUpdate = [];
  const availableChannels = Notifications.ChannelCfg.getAvailableChannels();

  availableChannels.forEach(channel => {
    let isCurrentlyEnabled = false;
    let needToBeEnabled = false;
    if (pinpointNotificationsMeta.output && pinpointNotificationsMeta.output.Id) {
      if (pinpointNotificationsMeta.output[channel] && pinpointNotificationsMeta.output[channel].Enabled) {
        isCurrentlyEnabled = true;
      }
    }

    if (pinpointNotificationsMeta.channels && pinpointNotificationsMeta.channels.includes(channel)) {
      needToBeEnabled = true;
    }
    if (
      pinpointInputParams
      && pinpointInputParams[channel]
      && Object.prototype.hasOwnProperty.call(pinpointInputParams[channel], 'Enabled')
    ) {
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
export const checkAndCreatePinpointApp = async (context: $TSContext, channelName: string, pinpointAppStatus: $TSAny) : Promise<$TSAny> => {
  if (isPinpointDeploymentRequired(channelName, pinpointAppStatus)) {
    await viewShowInlineModeInstructionsStart(channelName);
    try {
      // updates the pinpoint app status
      // eslint-disable-next-line no-param-reassign
      pinpointAppStatus = await pushAuthAndAnalyticsPinpointResources(context, pinpointAppStatus);
      // eslint-disable-next-line no-param-reassign
      pinpointAppStatus = await ensurePinpointApp(context, pinpointAppStatus);
      await viewShowInlineModeInstructionsStop(channelName);
    } catch (err) {
      // if the push fails, the user will be prompted to deploy the resource manually
      await viewShowInlineModeInstructionsFail(channelName, err);
      throw new Error('Failed to deploy Auth and Pinpoint resources. Please deploy them manually.');
    }
    // eslint-disable-next-line no-param-reassign
    context = pinpointAppStatus.context;
  }

  if (isPinpointAppDeployed(pinpointAppStatus.status) || Notifications.ChannelCfg.isChannelDeploymentDeferred(channelName)) {
    try {
      const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.enableChannel(context, channelName);
      await writeData(context, channelAPIResponse);
    } catch (e) {
      console.log('Enable Channel Failed!! ', e);
    }
  }
};

const pushChanges = async (context: $TSContext, pinpointNotificationsMeta: $TSAny):Promise<Array<IChannelAPIResponse|undefined>> => {
  let pinpointInputParams : $TSAny;

  if (context?.exeInfo?.inputParams?.categories
       && context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS]
       && context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT]
  ) {
    pinpointInputParams = context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
    context.exeInfo.pinpointInputParams = pinpointInputParams;
  }

  let pinpointAppStatus : IPinpointAppStatus = await getPinpointAppStatus(context, context.exeInfo.amplifyMeta,
    pinpointNotificationsMeta, context.exeInfo.localEnvInfo.envName);
  pinpointAppStatus = await ensurePinpointApp(context, pinpointNotificationsMeta, pinpointAppStatus, context.exeInfo.localEnvInfo.envName);

  const tasks: Array<$TSAny> = [];
  const results: Array<IChannelAPIResponse | undefined> = [];
  /**
   * per current understanding, the following code is only executed when the user is in pull and env add states.
   * In the Pull/Env add case input params are empty and need to be initialized from thecontext.exeInfo.backendConfig
   */
  if (!pinpointInputParams && context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    pinpointInputParams = buildPinpointInputParametersFromAmplifyMeta(context);
  }
  const { channelsToEnable, channelsToDisable } = getEnabledDisabledChannelsFromConfigAndMeta(pinpointInputParams,
    pinpointNotificationsMeta);
  // if any enabled channel requires a pinpoint app to be deployed then
  // deploy it and save state before attempting to enable the channel
  for (const channelName of channelsToEnable) {
    try {
      await checkAndCreatePinpointApp(context, channelName, pinpointAppStatus);
    } catch (err) {
      printer.info(`Please run "amplify push" to deploy the ${channelName} channel.`);
    }
  }

  channelsToEnable.forEach(channel => tasks.push(async () => {
    const result = await notificationManager.enableChannel(context, channel);
    results.push(result);
  }));
  channelsToDisable.forEach(channel => tasks.push(async () => {
    const result = await notificationManager.disableChannel(context, channel);
    results.push(result);
    return result;
  }));

  // channelsToUpdate.forEach((channel) => {
  //   tasks.push(() => notificationManager.configureChannel(context, channel));
  // });

  await sequential(tasks);
  return results;
};

// legacy structure used to sync state
// Remove this once all notifications are implemented in CFN.
interface IPinpointMeta {
  serviceName: string,
  service: string,
  channels: Array<string>,
  Name: string,
  Id: string,
  Region: string,
  lastPushTimeStamp: string|undefined,
}

/**
 * save updated Metafiles into TeamProviderInfo, BackendConfig and AmplifyMeta files and for INLINE deployments
 * upload currentBackend todeployment bucket. channelAPIResponse is undefined for legacy non CFN behavior.
 * @param context amplify-cli context
 */
export const writeData = async (context: $TSContext, channelAPIResponse: IChannelAPIResponse | undefined):Promise<void> => {
  // channelAPIResponse is not set in a `amplify pull` and `amplify env add` flow.
  // Inline deployment is set for all legacy channels (not deployed through CFN)
  // Here the Pinpoint resource is deployed and Id is valid, also the cloudBackend is synced.
  if (!channelAPIResponse || channelAPIResponse.deploymentType === ChannelConfigDeploymentType.INLINE) {
    if (channelAPIResponse) {
      // Updates the enabled/disabled flags for channels from the API response
      await Notifications.updateChannelAPIResponse(context, channelAPIResponse);
    }
    const analyticsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.ANALYTICS];
    const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const notificationsServiceMeta = await Notifications.Meta.getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const enabledChannels: Array<string> = await Notifications.Meta.getEnabledChannelsFromAppMeta(context.exeInfo.amplifyMeta);
    // This normalization will be removed once all notifications are deployed through CFN
    let pinpointMeta:IPinpointMeta | undefined;
    if (notificationsServiceMeta) {
      const applicationId = (notificationsServiceMeta.Id) || analyticsMeta[notificationsServiceMeta.ResourceName]?.output?.Id;
      const lastPushTimeStamp :string|undefined = (notificationsServiceMeta.lastPushTimeStamp)
      || (analyticsMeta[notificationsServiceMeta.ResourceName]?.lastPushTimeStamp);
      pinpointMeta = (notificationsServiceMeta) ? ({
        serviceName: notificationsServiceMeta.ResourceName,
        service: notificationsServiceMeta.service, // TBD: standardize this
        channels: enabledChannels,
        Name: notificationsServiceMeta.output.Name,
        Id: applicationId,
        Region: notificationsServiceMeta.Region,
        lastPushTimeStamp,
      }) : undefined;
    }

    // TODO: move writing to files logic to the cli core when those are ready
    await ensureEnvParamManager();
    writeTeamProviderInfo(pinpointMeta, context); // update Pinpoint data
    writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getBackendConfigFilePath());
    writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
    writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getCurrentBackendConfigFilePath());
    writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getCurrentAmplifyMetaFilePath());

    await context.amplify.storeCurrentCloudBackend(context);
    await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  } else {
    // For Deferred deployments: update context and backend-config
    await Notifications.updateChannelAPIResponse(context, channelAPIResponse);
    const analyticsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.ANALYTICS];
    const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const notificationsServiceMeta = await Notifications.Meta.getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const enabledChannels: Array<string> = await Notifications.Meta.getEnabledChannelsFromAppMeta(context.exeInfo.amplifyMeta);

    if (!notificationsServiceMeta) {
      throw new Error('WriteData: Failure: Amplify Meta not found for Notifications..');
    }
    // The applicationId is only generated once Analytics resource is deployed.
    // Until we find a generalized way to sync updates from provider categories like
    // Analytics to dependent categories like Notifications, we need to explicitly sync
    // the applicationId into Notifications.
    const applicationId = (notificationsServiceMeta.Id) || analyticsMeta[notificationsServiceMeta?.ResourceName]?.output?.Id;
    const lastPushTimeStamp :string|undefined = (notificationsServiceMeta.lastPushTimeStamp)
    || (analyticsMeta[notificationsServiceMeta.ResourceName]?.lastPushTimeStamp);
    const pinpointConfig = await Notifications.Cfg.getNotificationsAppConfig(context.exeInfo.backendConfig);
    const pinpointMeta = {
      serviceName: notificationsServiceMeta.ResourceName,
      service: notificationsServiceMeta.service, // TBD: standardize this
      channels: enabledChannels,
      Name: notificationsServiceMeta.output.Name,
      Id: applicationId,
      Region: notificationsServiceMeta.Region,
      lastPushTimeStamp,
    };

    // Team provider info and backend config are updated after push
    if (channelAPIResponse) {
      await Notifications.updateChannelAPIResponse(context, channelAPIResponse);
    }
    writeTeamProviderInfo(pinpointMeta, context); // update Pinpoint data
    if (pinpointConfig) {
      writeBackendConfig(context, pinpointConfig, context.amplify.pathManager.getBackendConfigFilePath());
    }
    writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
    await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  }
};

const writeTeamProviderInfo = (pinpointMeta:$TSAny): void => {
  if (!pinpointMeta) {
    return;
  }
  getEnvParamManager().getResourceParamManager(AmplifyCategories.ANALYTICS, AmplifySupportedService.PINPOINT).setAllParams({
    Name: pinpointMeta.Name,
    Id: pinpointMeta.Id,
    Region: pinpointMeta.Region,
  });
};

const writeBackendConfig = (context:$TSContext, pinpointMeta:$TSAny, backendConfigFilePath:string):void => {
  if (fs.existsSync(backendConfigFilePath)) {
    const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
    backendConfig[AmplifyCategories.NOTIFICATIONS] = backendConfig[AmplifyCategories.NOTIFICATIONS] || {};

    const resources = Object.keys(backendConfig[AmplifyCategories.NOTIFICATIONS]);
    for (let i = 0; i < resources.length; i++) {
      const serviceMeta = backendConfig[AmplifyCategories.NOTIFICATIONS][resources[i]];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT) {
        delete backendConfig[AmplifyCategories.NOTIFICATIONS][resources[i]];
      }
    }

    if (pinpointMeta) {
      backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointMeta.serviceName] = {
        service: pinpointMeta.service,
        channels: pinpointMeta.channels,
      };
    }

    const jsonString = JSON.stringify(backendConfig, null, 4);
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
};

const writeAmplifyMeta = (context:$TSContext, categoryMeta:$TSAny, amplifyMetaFilePath: string):void => {
  if (fs.existsSync(amplifyMetaFilePath)) {
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    amplifyMeta[AmplifyCategories.NOTIFICATIONS] = categoryMeta;
    const jsonString = JSON.stringify(amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
    context.exeInfo.amplifyMeta = amplifyMeta;
  }
};

/**
 *  migrate Pinpoint resource for older CLI versions
 * @param context amplify cli context
 */
export const migrate = async (context:$TSContext) : Promise<void> => {
  const migrationInfo = extractMigrationInfo(context);
  fillBackendConfig(context, migrationInfo);
  fillTeamProviderInfo(context, migrationInfo);
};

const extractMigrationInfo = (context:$TSContext):$TSAny => {
  let migrationInfo : $TSAny;
  const { amplifyMeta, localEnvInfo } = context.migrationInfo;
  if (amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const resources = Object.keys(categoryMeta);
    for (let i = 0; i < resources.length; i++) {
      const service = resources[i];
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

  if (migrationInfo && migrationInfo.output && migrationInfo.output.Id) {
    migrationInfo.Id = migrationInfo.output.Id;
    migrationInfo.Name = migrationInfo.output.Name;
    migrationInfo.Region = migrationInfo.output.Region;
    migrationInfo.channels = [];
    const availableChannels = Notifications.ChannelCfg.getAvailableChannels();
    availableChannels.forEach(channel => {
      if (migrationInfo.output[channel] && migrationInfo.output[channel].Enabled) {
        migrationInfo.channels.push(channel);
      }
    });
  }

  return migrationInfo;
};

const fillBackendConfig = (context:$TSContext, migrationInfo: $TSAny): void => {
  if (migrationInfo) {
    const backendConfig:$TSAny = {};
    backendConfig[migrationInfo.serviceName] = {
      service: migrationInfo.service,
      channels: migrationInfo.channels,
    };
    Object.assign(context.migrationInfo.backendConfig[AmplifyCategories.NOTIFICATIONS], backendConfig);
  }
};

const fillTeamProviderInfo = (context: $TSContext, migrationInfo: $TSAny):void => {
  if (migrationInfo && migrationInfo.Id) {
    const categoryTeamInfo:$TSAny = {};
    categoryTeamInfo[AmplifyCategories.NOTIFICATIONS] = {};
    categoryTeamInfo[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT] = {
      Name: migrationInfo.Name,
      Id: migrationInfo.Id,
      Region: migrationInfo.Region,
    };

    const { teamProviderInfo } = context.migrationInfo;
    teamProviderInfo[migrationInfo.envName] = teamProviderInfo[migrationInfo.envName] || {};

    teamProviderInfo[migrationInfo.envName].categories = teamProviderInfo[migrationInfo.envName].categories || {};

    Object.assign(teamProviderInfo[migrationInfo.envName].categories, categoryTeamInfo);
  }
};

module.exports = {
  initEnv,
  deletePinpointAppForEnv,
  writeData,
  migrate,
};
