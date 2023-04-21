import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  INotificationsResource,
  IPluginAPIResponse,
  PluginAPIError,
} from '@aws-amplify/amplify-cli-core';
import * as notificationManager from './notifications-manager';
import { IChannelAPIResponse } from './channel-types';
import { writeData } from './multi-env-manager-utils';
import { getAvailableChannels } from './notifications-backend-cfg-channel-api';
import { getNotificationsAppMeta } from './notifications-amplify-meta-api';
import { getNotificationsAppConfig } from './notifications-backend-cfg-api';

/**
 * Get Notifications Resource Info
 * @returns INotificationsResource
 */
export const notificationsPluginAPIGetResource = async (context: $TSContext): Promise<INotificationsResource | undefined> => {
  context.exeInfo = context.exeInfo || context.amplify.getProjectDetails();
  const notificationsBackendConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
  const notificationsMeta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta);
  const response: INotificationsResource | undefined = notificationsBackendConfig
    ? {
        id: notificationsMeta?.Id,
        region: notificationsMeta?.Region,
        output: notificationsMeta?.output, // cloudformation deployment outputs - indicates resource deployed
        category: AmplifyCategories.NOTIFICATIONS,
        resourceName: notificationsBackendConfig?.serviceName,
        service: AmplifySupportedService.PINPOINT,
      }
    : undefined;
  return response;
};

/**
 *  Remove Notifications App - recursively remove the Notifications App.
 */
export const notificationsPluginAPIRemoveApp = async (context: $TSContext, appName: string): Promise<IPluginAPIResponse | undefined> => {
  context.exeInfo = context.exeInfo ? context.exeInfo : context.amplify.getProjectDetails();
  context.exeInfo.serviceMeta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta, appName);
  // trigger remove notifications flow
  try {
    await notificationsAPIRemoveApp(context);
    const successResponse: IPluginAPIResponse = {
      pluginName: AmplifyCategories.NOTIFICATIONS,
      resourceProviderServiceName: AmplifySupportedService.PINPOINT, // Service which provisions capability, subCapability e.g Pinpoint
      status: true, // true - successfully applied, false - failed to apply
    };
    return successResponse;
  } catch (error) {
    const errorResponse: IPluginAPIResponse = {
      pluginName: AmplifyCategories.NOTIFICATIONS,
      resourceProviderServiceName: AmplifySupportedService.PINPOINT, // Service which provisions capability, subCapability e.g Pinpoint
      status: false, // true - successfully applied, false - failed to apply
      errorCode: PluginAPIError.E_UNKNOWN,
      reasonMsg: error as string,
    };
    return errorResponse;
  }
};

/**
 * Runs delete for all channels and then removes the Notifications category config from backendConfig.
 * @param context amplify cli context
 * @returns updated amplify cli context
 */
export const notificationsAPIRemoveApp = async (context: $TSContext): Promise<$TSContext> => {
  const channelAPIResponseList: IChannelAPIResponse[] = await notificationManager.disableAllChannels(context);

  for (const channelAPIResponse of channelAPIResponseList) {
    await writeData(context, channelAPIResponse);
  }
  await notificationManager.removeEmptyNotificationsApp(context);
  await writeData(context, undefined);
  return context;
};

/**
 * Returns all the allowed channels for the Notifications App.
 * @returns Names of all available notifications channels
 */
export const notificationsAPIGetAvailableChannelNames = async (): Promise<string[]> => getAvailableChannels();
