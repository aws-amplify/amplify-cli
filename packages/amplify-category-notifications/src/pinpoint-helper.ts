/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
/* eslint-disable max-depth */

import ora from 'ora';
import {
  $TSAny, $TSContext, open, AmplifySupportedService, AmplifyCategories, stateManager, IAmplifyResource,
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
 * Ensure Pinpoint app exists
 */
export const ensurePinpointApp = async (context: $TSContext, pinpointNotificationsMeta: $TSAny): Promise<$TSContext> => {
  let pinpointApp : Partial<ICategoryMeta>|undefined;
  let resourceName;
  const amplifyMeta = stateManager.getMeta();
  const backendConfig = stateManager.getBackendConfig();
  const envName = stateManager.getCurrentEnvName();
  if (!envName) {
    console.log('Current ENV not configured!!');
    return context;
  }

  if (pinpointNotificationsMeta) {
    if (
      pinpointNotificationsMeta.service === AmplifySupportedService.PINPOINT
      && pinpointNotificationsMeta.output
      && pinpointNotificationsMeta.output.Id
    ) {
      if (pinpointNotificationsMeta.resourceName) {
        resourceName = pinpointNotificationsMeta.resourceName; //eslint-disable-line
      } else {
        resourceName = PinpointName.extractResourceName(pinpointNotificationsMeta.Name, envName);
      }

      pinpointApp = pinpointNotificationsMeta.output;
      NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, pinpointApp as ICategoryMeta);
    } else {
      resourceName = pinpointNotificationsMeta.resourceName; //eslint-disable-line
    }
  }
  // Scan for Pinpoint resource in Notifications category
  if (!pinpointApp) {
    const scanOptions : $TSAny = {
      isRegulatingResourceName: true,
      envName,
    };
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], scanOptions);
    if (pinpointApp) {
      resourceName = scanOptions.regulatedResourceName;
    }
  }
  // Sync Pinpoint resource from Analytics
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
    if (pinpointApp?.Name) {
      resourceName = PinpointName.extractResourceName(pinpointApp.Name, envName);
      context.exeInfo.amplifyMeta = NotificationsMeta.constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
      // create updated version of backend-config with notifications resource configuration
      context.exeInfo.backendConfig = await NotificationsDB.addPartialNotificationsBackendConfig(resourceName);
    }
  }
  // Scan for Pinpoint resource which is only locally created but not yet pushed to the cloud
  if (!pinpointApp) {
    const resources: IAmplifyResource[] = await invokeAnalyticsAPIGetResources(context, AmplifySupportedService.PINPOINT);
    if (resources.length > 0) {
      resourceName = PinpointName.extractResourceName(resources[0].resourceName, envName);
    } else {
      // Create the Pinpoint resource if not yet created
      context.print.info('Notifications requires a Pinpoint analytics resource, creating.....');
      const resourceResult = await invokeAnalyticsAPICreateResource(context, AmplifySupportedService.PINPOINT);
      resourceName = resourceResult.resourceName;
    }
    // create updated version of amplify-meta with notifications resource
    context.exeInfo.amplifyMeta = await NotificationsMeta.addPartialNotificationsAppMeta(context, resourceName);
    // create updated version of backend-config with notifications resource configuration
    context.exeInfo.backendConfig = await NotificationsDB.addPartialNotificationsBackendConfig(resourceName);
  }
 
  context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName];
  context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
  return context; // must have amplify-meta and backend-config updated
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
  ensurePinpointApp,
  deletePinpointApp,
  getPinpointClient,
  isAnalyticsAdded,
  isNotificationChannelEnabled: NotificationsDB.isChannelEnabledNotificationsBackendConfig,
  scanCategoryMetaForPinpoint,
  console: channelInAppConsole,
};
