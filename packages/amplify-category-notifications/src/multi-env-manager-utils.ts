import * as fs from 'fs-extra';
import { ensureEnvParamManager, getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSAny, $TSContext, $TSMeta, AmplifyCategories, amplifyFaultWithTroubleshootingLink, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';
import { ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
import { getEnabledChannelsFromAppMeta, getNotificationsAppMeta } from './notifications-amplify-meta-api';
import { getNotificationsAppConfig } from './notifications-backend-cfg-api';
import { updateChannelAPIResponse } from './notifications-api';

const writeTeamProviderInfo = (pinpointMeta: $TSAny): void => {
  if (!pinpointMeta) {
    return;
  }
  getEnvParamManager().getResourceParamManager(AmplifyCategories.ANALYTICS, AmplifySupportedService.PINPOINT).setAllParams({
    Name: pinpointMeta.Name,
    Id: pinpointMeta.Id,
    Region: pinpointMeta.Region,
  });
};

const writeBackendConfig = (context: $TSContext, pinpointMeta: $TSAny, backendConfigFilePath: string): void => {
  if (fs.existsSync(backendConfigFilePath)) {
    const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
    backendConfig[AmplifyCategories.NOTIFICATIONS] = backendConfig[AmplifyCategories.NOTIFICATIONS] || {};

    const resources = Object.keys(backendConfig[AmplifyCategories.NOTIFICATIONS]);
    for (const resource of resources) {
      const serviceMeta = backendConfig[AmplifyCategories.NOTIFICATIONS][resource];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT) {
        delete backendConfig[AmplifyCategories.NOTIFICATIONS][resource];
      }
    }

    if (pinpointMeta) {
      backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointMeta.serviceName] = {
        service: pinpointMeta.service,
        channels: pinpointMeta.channels,
      };
    }

    stateManager.setBackendConfig(undefined, backendConfig);
  }
};

/**
 * save updated Meta files into TeamProviderInfo, BackendConfig and AmplifyMeta files and for INLINE deployments
 * upload currentBackend deployment bucket. channelAPIResponse is undefined for legacy non CFN behavior.
 * @param context amplify-cli context
 */
export const writeData = async (context: $TSContext, channelAPIResponse: IChannelAPIResponse | undefined):Promise<void> => {
  // channelAPIResponse is not set in a `amplify pull` and `amplify env add` flow.
  // Inline deployment is set for all legacy channels (not deployed through CFN)
  // Here the Pinpoint resource is deployed and Id is valid, also the cloudBackend is synced.
  if (!channelAPIResponse || channelAPIResponse.deploymentType === ChannelConfigDeploymentType.INLINE) {
    if (channelAPIResponse) {
      // Updates the enabled/disabled flags for channels from the API response
      await updateChannelAPIResponse(context, channelAPIResponse);
    }
    const analyticsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.ANALYTICS];
    const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const notificationsServiceMeta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const enabledChannels: Array<string> = await getEnabledChannelsFromAppMeta(context.exeInfo.amplifyMeta);
    // This normalization will be removed once all notifications are deployed through CFN
    let pinpointMeta;
    if (notificationsServiceMeta) {
      const applicationId = (notificationsServiceMeta.Id) || analyticsMeta[notificationsServiceMeta.ResourceName]?.output?.Id;
      const lastPushTimeStamp = (notificationsServiceMeta.lastPushTimeStamp)
      || (analyticsMeta[notificationsServiceMeta.ResourceName]?.lastPushTimeStamp);
      pinpointMeta = {
        serviceName: notificationsServiceMeta.ResourceName,
        service: notificationsServiceMeta.service, // TBD: standardize this
        channels: enabledChannels,
        Name: notificationsServiceMeta.output.Name,
        Id: applicationId,
        Region: notificationsServiceMeta.Region,
        lastPushTimeStamp,
      };
    }

    // TODO: move writing to files logic to the cli core when those are ready
    await ensureEnvParamManager();
    writeTeamProviderInfo(pinpointMeta); // update Pinpoint data
    writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getBackendConfigFilePath());
    stateManager.setMeta(undefined, updateNotificationsMeta(stateManager.getMeta(), categoryMeta));
    writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getCurrentBackendConfigFilePath());
    stateManager.setCurrentMeta(undefined, updateNotificationsMeta(stateManager.getCurrentMeta(), categoryMeta));

    await context.amplify.storeCurrentCloudBackend(context);
  } else {
    // For Deferred deployments: update context and backend-config
    await updateChannelAPIResponse(context, channelAPIResponse);
    const analyticsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.ANALYTICS];
    const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
    const notificationsServiceMeta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta);
    const enabledChannels: Array<string> = await getEnabledChannelsFromAppMeta(context.exeInfo.amplifyMeta);

    if (!notificationsServiceMeta) {
      throw amplifyFaultWithTroubleshootingLink('ConfigurationFault', {
        message: 'Failed to store notifications meta. Amplify Meta not found for Notifications.',
      });
    }
    // The applicationId is only generated once Analytics resource is deployed.
    // Until we find a generalized way to sync updates from provider categories like
    // Analytics to dependent categories like Notifications, we need to explicitly sync
    // the applicationId into Notifications.
    const applicationId = (notificationsServiceMeta.Id) || analyticsMeta[notificationsServiceMeta?.ResourceName]?.output?.Id;
    const lastPushTimeStamp :string|undefined = (notificationsServiceMeta.lastPushTimeStamp)
    || (analyticsMeta[notificationsServiceMeta.ResourceName]?.lastPushTimeStamp);
    const pinpointConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
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
    await updateChannelAPIResponse(context, channelAPIResponse);
    writeTeamProviderInfo(pinpointMeta); // update Pinpoint data
    if (pinpointConfig) {
      writeBackendConfig(context, pinpointConfig, context.amplify.pathManager.getBackendConfigFilePath());
    }
    stateManager.setMeta(undefined, updateNotificationsMeta(stateManager.getMeta(), categoryMeta));
  }
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
};

const updateNotificationsMeta = (meta: $TSMeta, notificationsMeta: $TSAny): $TSMeta => {
  // eslint-disable-next-line no-param-reassign
  meta[AmplifyCategories.NOTIFICATIONS] = notificationsMeta;
  return meta;
};
