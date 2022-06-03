/* eslint-disable max-depth */
/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */

import ora from 'ora';
import {
  $TSAny, $TSContext, open, AmplifySupportedService, AmplifyCategories, stateManager, IAnalyticsResource, PluginAPIError,
} from 'amplify-cli-core';
import {
  invokeAnalyticsAPICreateResource,
  invokeAnalyticsAPIGetResources,
} from './analytics-resource-api';

import * as authHelper from './auth-helper';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { NotificationsDB } from './notifications-backend-cfg-api';
import { NotificationsMeta } from './notifications-meta-api';
import { PinpointName } from './pinpoint-name';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from './notifications-api-types';

const providerName = 'awscloudformation';
const spinner = ora('');

/**
 * Get the Pinpoint app from analytics category
 */
export const getPinpointApp = (context: $TSContext):ICategoryMeta|undefined => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  return pinpointApp;
};

/**
 * Pinpoint deployment status based on resource owner ( Analytics, Notifications, Custom )
 */
export const enum IPinpointDeploymentStatus {
  NO_ENV = 'NO_ENV',
  APP_NOT_CREATED = 'APP_NOT_CREATED',
  APP_IS_CREATED_NOT_DEPLOYED = 'APP_IS_CREATED_NOT_DEPLOYED', // needs 'amplify push' : we need this until deferred push is implemented
  APP_IS_DEPLOYED = 'APP_IS_DEPLOYED_ANALYTICS',
  APP_IS_DEPLOYED_CUSTOM = 'APP_IS_DEPLOYED_NOTIFICATIONS', // legacy application is deployed manually or through notifications
}

/**
 * Analytics Pinpoint App status
 */
export interface IPinpointAppStatus {
  status: IPinpointDeploymentStatus,
  app: IAnalyticsResource|undefined
  context: $TSContext
}

/**
 * Given a pinpoint resource deployment state returns true if channel can be programmed
 */
export const isPinpointAppDeployed = (pinpointStatus: IPinpointDeploymentStatus): boolean => {
  return ((pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED)
   || (pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM));
};

/**
 * Only legacy apps where PinpointApp is allocated through
 * Notifications will return true.
 * @param pinpointStatus deployment state of the PinpointApp
 * @returns true if owned by Notifications
 */
export const isPinpointAppOwnedByNotifications = (pinpointStatus: IPinpointDeploymentStatus): boolean => {
  return (pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM);
};

/**
 * Helper: convert generic exception to reason message
 * note - To be replaced with generic error handler
 * @param error Error thrown by the library function
 * @returns error message extracted from Error
 */
const getErrorMessage = (error: unknown) : string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error) as string;
};

/**
 * Helper function to normalize Notifications Pinpoint App to Analytics result
 * - This function will be removed once all Analytics and Notifications meta is normalized
 * @param pinpointApp - PinpointApp metadata extracted from Notifications
 * @param envName - environment of the amplify app.
 * @returns Pinpoint analytics resource metadata
 */
const buildAnalyticsResourceFromPinpointApp = (pinpointApp : ICategoryMeta, envName: string) :IAnalyticsResource => {
  const regulatedResourceName: string = (pinpointApp.regulatedResourceName) || PinpointName.extractResourceName(pinpointApp.Name, envName);
  const analyticsResource:IAnalyticsResource = {
    category: AmplifyCategories.NOTIFICATIONS,
    service: AmplifySupportedService.PINPOINT,
    resourceName: regulatedResourceName,
    id: pinpointApp.Id,
    region: pinpointApp.Region,
    output: {
      Name: pinpointApp.Name,
      Region: pinpointApp.Region,
      Id: pinpointApp.Id,
      regulatedResourceName,
    },
  };
  return analyticsResource;
};

/**
 * Helper function to build Channel-API success response.
 * note:- This will be moved to the Analytics category.
 * @param action (enable, disable, configure, pull)
 * @param deploymentType (INLINE- deployed immediately, DEFERRED - requires an amplify push)
 * @param channelName (SMS,InAppMessaging...)
 * @returns Channel API response
 */
export const buildPinpointChannelResponseSuccess = (action: ChannelAction,
  deploymentType: ChannelConfigDeploymentType, channelName: string, output?: $TSAny): IChannelAPIResponse => ({
  action,
  channel: channelName,
  deploymentType,
  response: {
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    capability: AmplifyCategories.NOTIFICATIONS, // Notifications
    subCapability: channelName, // e.g SMS
    status: true, // true - successfully applied, false - failed to apply
  },
  output,
});

/**
 * Helper function to build Channel-API error response.
 * note:- This will be moved to the Analytics category.
 * @param action (enable, disable, configure, pull)
 * @param deploymentType (INLINE- deployed immediately, DEFERRED - requires an amplify push)
 * @param channelName (SMS,InAppMessaging...)
 * @param err (channel api error)
 * @returns Channel API response
 */
export const buildPinpointChannelResponseError = (action: ChannelAction,
  deploymentType: ChannelConfigDeploymentType, channelName: string, err: Error): IChannelAPIResponse => ({
  action,
  deploymentType,
  channel: channelName,
  response: {
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    capability: AmplifyCategories.NOTIFICATIONS, // Notifications
    subCapability: channelName, // e.g SMS
    status: false, // true - successfully applied, false - failed to apply
    errorCode: PluginAPIError.E_SVC_PROVIDER_SDK,
    reasonMsg: getErrorMessage(err),
  },
});

/**
 * Get Pinpoint app status from notifications meta ( in-core or in-file )
 * TBD: Move to NotificationsDB API
 * @param notificationsMeta - notificationsMeta from context (in-core)
 * @param amplifyMeta - amplify-meta from amplify-meta.json (in-file)
 * @param envName - application environment
 * @returns PinpointApp
 */
export const getPinpointAppStatusNotifications = (notificationsMeta: $TSAny,
  amplifyMeta: $TSAny, envName: string):ICategoryMeta|undefined => {
  let notificationsPinpointApp:ICategoryMeta|undefined;
  const scanOptions : $TSAny = {
    isRegulatingResourceName: true,
    envName,
  };
  if (notificationsMeta?.service === AmplifySupportedService.PINPOINT
    && notificationsMeta?.output) {
    notificationsPinpointApp = notificationsMeta.output;
  } else {
    notificationsPinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], scanOptions);
  }
  return notificationsPinpointApp;
};

/**
 * Check if PinpointApp is created in Analytics and Notifications.
 */
export const getPinpointAppStatus = async (context: $TSContext, amplifyMeta: $TSAny,
  pinpointNotificationsMeta: $TSAny, envName: string|undefined): Promise<IPinpointAppStatus> => {
  const resultPinpointApp: IPinpointAppStatus = {
    status: IPinpointDeploymentStatus.APP_NOT_CREATED,
    app: undefined,
    context,
  };
  if (!envName) {
    resultPinpointApp.status = IPinpointDeploymentStatus.NO_ENV;
    return resultPinpointApp;
  }
  // Get PinpointApp from Analytics
  const resources: IAnalyticsResource[] = await invokeAnalyticsAPIGetResources(context, AmplifySupportedService.PINPOINT);
  if (resources.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    resultPinpointApp.app = resources[0];
    resultPinpointApp.status = (resultPinpointApp.app.id) ? IPinpointDeploymentStatus.APP_IS_DEPLOYED
      : IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED;
  }
  // Check if Notifications is using an App but different from Analytics - Legacy behavior
  const notificationsPinpointApp:ICategoryMeta|undefined = getPinpointAppStatusNotifications(pinpointNotificationsMeta,
    amplifyMeta, envName);
  if (notificationsPinpointApp?.Id && notificationsPinpointApp.Id !== resultPinpointApp?.app?.id) {
    resultPinpointApp.status = IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM;
    resultPinpointApp.app = buildAnalyticsResourceFromPinpointApp(notificationsPinpointApp, envName);
  }
  return resultPinpointApp;
};

/**
 * Display 'amplify push' required prompt.
 * @param context amplify cli context
 */
export const viewShowAmplifyPushRequired = (context: $TSContext):void => {
  context.print.info('Run "amplify push" to deploy the Pinpoint resource and then retry...');
};

const getPinpointAppFromAnalyticsOutput = (analyticsMeta: IAnalyticsResource): Partial<ICategoryMeta> => {
  const pinpointApp: Partial<ICategoryMeta> = {
    Id: analyticsMeta.id,
    Name: analyticsMeta.output.appName,
    Region: analyticsMeta.region,
    regulatedResourceName: analyticsMeta.resourceName,
  };
  return pinpointApp;
};

// /**
//  * Call this to remove the notifications category only after all channels have been disabled.
//  * @param context Amplify CLI context
//  */
// export const removeEmptyNotificationsApp = async (context: $TSContext ): Promise<boolean> =>{
//   const amplifyMeta = (context.exeInfo.amplifyMeta) || stateManager.getMeta();
//   const backendConfig = (context.exeInfo.amplifyMeta) || stateManager.getBackendConfig();
//   context.exeInfo.amplifyMeta = NotificationsMeta.removeNotifications(amplifyMeta);
//   context.exeInfo.backendConfig = NotificationsDB.removeNotifications(backendConfig);
// }

/**
 * Ensure Pinpoint app exists
 */
export const ensurePinpointApp = async (context: $TSContext, pinpointNotificationsMeta: $TSAny,
  appStatus?:IPinpointAppStatus, appEnvName?:string): Promise<IPinpointAppStatus> => {
  let pinpointApp : Partial<ICategoryMeta>|undefined;
  let resourceName;
  const amplifyMeta = (context.exeInfo.amplifyMeta) || stateManager.getMeta();
  const envName = (appEnvName) || stateManager.getCurrentEnvName();
  const pinpointAppStatus = (appStatus) || await getPinpointAppStatus(context, amplifyMeta, pinpointNotificationsMeta, envName);
  // console.log('SACPCDEBUG: ensurePinpointApp:PinpointAppStatus.app: ', JSON.stringify(pinpointAppStatus.app, null, 2));
  switch (pinpointAppStatus.status) {
    case IPinpointDeploymentStatus.NO_ENV: {
      console.log('Current ENV not configured!!');
      return pinpointAppStatus;
    }
    case IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM: {
      // This will always be true for DEPLOYED_CUSTOM since we do not allow custom
      // Pinpoint resource in Notifications category.
      if (pinpointAppStatus.app?.output && pinpointAppStatus.app?.resourceName) {
        pinpointApp = pinpointAppStatus.app?.output;
        resourceName = pinpointAppStatus.app?.resourceName;
        // Update pinpointApp into Notifications amplifyMeta (in-core)
        NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, pinpointApp as ICategoryMeta);
      }
      break;
    }
    case IPinpointDeploymentStatus.APP_IS_DEPLOYED: {
      // Sync Pinpoint resource from Analytics
      if (pinpointAppStatus.app?.output && pinpointAppStatus.app?.resourceName) {
        pinpointApp = getPinpointAppFromAnalyticsOutput(pinpointAppStatus.app);
        resourceName = pinpointAppStatus.app.resourceName as string;
        // create updated version of amplify-meta with notifications resource
        context.exeInfo.amplifyMeta = NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
        // create updated version of backend-config with notifications resource configuration
        context.exeInfo.backendConfig = await NotificationsDB.addPartialNotificationsBackendConfig(resourceName,
          context.exeInfo.backendConfig);
      }
      break;
    }
    case IPinpointDeploymentStatus.APP_NOT_CREATED: {
      // Create the Pinpoint resource if not yet created
      context.print.warning('Adding notifications would add a Pinpoint resource from Analytics category if not already added');
      const resourceResult = await invokeAnalyticsAPICreateResource(context, AmplifySupportedService.PINPOINT);
      resourceName = resourceResult.resourceName;
      // create updated version of amplify-meta with notifications resource
      context.exeInfo.amplifyMeta = await NotificationsMeta.addPartialNotificationsAppMeta(context, resourceName);
      // create updated version of backend-config with notifications resource configuration
      context.exeInfo.backendConfig = await NotificationsDB.addPartialNotificationsBackendConfig(resourceName,
        context.exeInfo.backendConfig);
      // The Pinpoint resource is locally created, but requires an amplify push for channels to be programmed
      // note:- This is temporary until deployment state-machine supports deferred resource push.
      viewShowAmplifyPushRequired(context);
      break;
    }
    case IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED: {
      // console.log('SACPCDEBUG:APP_IS_CREATED_NOT_DEPLOYED: PinpointDeploymentStatus: ', JSON.stringify(pinpointAppStatus.app, null, 2));
      resourceName = pinpointAppStatus.app?.resourceName;
      if (resourceName) {
        // create updated version of amplify-meta with notifications resource
        context.exeInfo.amplifyMeta = await NotificationsMeta.addPartialNotificationsAppMeta(context, resourceName);
        // create updated version of backend-config with notifications resource configuration
        context.exeInfo.backendConfig = await NotificationsDB.addPartialNotificationsBackendConfig(resourceName,
          context.exeInfo.backendConfig);
      }
      viewShowAmplifyPushRequired(context);
      break;
    }
    default:
      throw new Error(`Invalid Pinpoint App Status ${pinpointAppStatus.status} : App: ${pinpointAppStatus.app}`);
  }

  if (resourceName && context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName];
    context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;

    // console.log('SACPCDEBUG:APP_IS_DEPLOYED:In-Memory serviceMeta: ', JSON.stringify(context.exeInfo.serviceMeta, null, 2));
    // console.log('SACPCDEBUG:APP_IS_DEPLOYED:In-Memory pinpointApp: ', JSON.stringify(context.exeInfo.serviceMeta.output, null, 2));
  }

  pinpointAppStatus.context = context;
  return pinpointAppStatus; // must have amplify-meta and backend-config updated
};

/**
 * Delete Pinpoint App
 */
export const deletePinpointApp = async (context: $TSContext):Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp : ICategoryMeta|undefined = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  if (pinpointApp) {
    await authHelper.deleteRolePolicy(context);
    pinpointApp = await deleteApp(context, pinpointApp.Id) as ICategoryMeta;
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], pinpointApp.Id);
  }
};

/**
 * Scan AmplifyMeta for given category
 * @param categoryMeta - CategoryMeta is updated if CLI is regulating pinpoint resource name
 * @param options - amplify cli options
 */
export const scanCategoryMetaForPinpoint = (categoryMeta: $TSAny, options: $TSAny): ICategoryMeta|undefined => {
  let result:ICategoryMeta|undefined;
  if (categoryMeta) {
    const resources = Object.keys(categoryMeta);
    for (const resourceName of resources) {
      const serviceMeta = categoryMeta[resourceName];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
          Name: serviceMeta.output.Name || serviceMeta.output.appName,
          Region: serviceMeta.output.Region,
        };

        if (options && options.isRegulatingResourceName) {
          const regulatedResourceName = PinpointName.extractResourceName(result.Name, options.envName);
          options.regulatedResourceName = regulatedResourceName;
          if (resourceName !== regulatedResourceName) {
            categoryMeta[regulatedResourceName] = serviceMeta;
            delete categoryMeta[resourceName];
          }
        }
        break;
      }
    }
  }

  return result;
};

const removeCategoryMetaForPinpoint = (categoryMeta: $TSAny, pinpointAppId: string):void => {
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id === pinpointAppId) {
        delete categoryMeta[services[i]];
      }
    }
  }
};

const deleteApp = async (context : $TSContext, pinpointAppId : string) : Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pinpointClient = await getPinpointClient(context, 'delete', envName);
  spinner.start('Deleting Pinpoint app.');
  return new Promise((resolve, reject) => {
    pinpointClient.deleteApp(params, (err: $TSAny, data: $TSAny) => {
      if (err && err.code === 'NotFoundException') {
        spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
        resolve({
          Id: params.ApplicationId,
        });
      } else if (err) {
        spinner.fail('Pinpoint project deletion error');
        reject(err);
      } else {
        spinner.succeed(`Successfully deleted Pinpoint project: ${data.ApplicationResponse.Name}`);
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
};

/**
 * Open the AWS console in the browser for the given service.
 */
export const channelInAppConsole = (context: $TSContext):void => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp : ICategoryMeta|undefined = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  if (pinpointApp) {
    const { Id, Region } = pinpointApp;
    const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/settings`;
    open(consoleUrl, { wait: false });
  } else {
    context.print.error('Neither notifications nor analytics is enabled in the cloud.');
  }
};

/**
 * Get Pinpoint client from cloudformation
 */
export const getPinpointClient = async (context : $TSContext, action: string, envName: string):Promise<$TSAny> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  return provider.getConfiguredPinpointClient(context, AmplifyCategories.NOTIFICATIONS, action, envName);
};

/**
 * Check if Analytics has been enabled
 */
export const isAnalyticsAdded = (context: $TSContext):boolean => {
  const { amplifyMeta } = context.exeInfo;
  let result = false;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  if (pinpointApp) {
    result = true;
  }
  return result;
};

module.exports = {
  getPinpointApp,
  getPinpointAppStatus,
  ensurePinpointApp,
  isPinpointAppDeployed,
  isPinpointAppOwnedByNotifications,
  buildPinpointChannelResponseSuccess,
  buildPinpointChannelResponseError,
  deletePinpointApp,
  getPinpointClient,
  isAnalyticsAdded,
  isNotificationChannelEnabled: NotificationsDB.isChannelEnabledNotificationsBackendConfig,
  scanCategoryMetaForPinpoint,
  console: channelInAppConsole,
};
