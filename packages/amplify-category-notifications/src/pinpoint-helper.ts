import ora from 'ora';
import {
  $TSAny,
  $TSContext,
  open,
  AmplifySupportedService,
  AmplifyCategories,
  stateManager,
  IAnalyticsResource,
  INotificationsResourceMeta,
  $TSMeta,
  AmplifyError,
  AmplifyFault,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import {
  invokeAnalyticsAPICreateResource,
  invokeAnalyticsAPIGetResources,
  invokeAnalyticsGetPinpointRegionMapping,
  invokeAnalyticsPush,
} from './plugin-client-api-analytics';
import * as authHelper from './auth-helper';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
import { PinpointName } from './pinpoint-name';
import { isChannelDeploymentDeferred } from './notifications-backend-cfg-channel-api';
import { constructResourceMeta, addPartialNotificationsAppMeta } from './notifications-amplify-meta-api';
import { addPartialNotificationsBackendConfig } from './notifications-backend-cfg-api';
import Pinpoint from 'aws-sdk/clients/pinpoint';
import {
  formUserAgentParam,
  loadConfiguration,
  resolveRegion,
  loadConfigurationForEnv,
} from '@aws-amplify/amplify-provider-awscloudformation';
import { ProxyAgent } from 'proxy-agent';
const spinner = ora('');
const defaultPinpointRegion = 'us-east-1';

/**
 * Get the Pinpoint app from analytics category
 */
export const getPinpointApp = (context: $TSContext): ICategoryMeta | undefined => {
  const { amplifyMeta } = context.exeInfo;
  return scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
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
  status: IPinpointDeploymentStatus;
  app: IAnalyticsResource | undefined;
  context: $TSContext;
}

/**
 * Given a pinpoint resource deployment state returns true if channel can be programmed
 */
export const isPinpointAppDeployed = (pinpointStatus: IPinpointDeploymentStatus): boolean =>
  pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED || pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM;

/**
 * Given the Pinpoint App Status and channelName return true if channel requires the Pinpoint resource to be deployed.
 * In-App-Messaging is deployed through and update to the the Analytics category CloudFormation.
 * note: - TBD!!:  in legacy deployments even In-App-Messaging is deployed in-line
 * isChannelDeploymentDeferred needs to be changed to check if environment is configured for legacy deployment.
 */
export const isPinpointDeploymentRequired = (channelName: string, pinpointAppStatus: IPinpointAppStatus): boolean =>
  !isPinpointAppDeployed(pinpointAppStatus.status) && !isChannelDeploymentDeferred(channelName);

/**
 * Only legacy apps where PinpointApp is allocated through
 * Notifications will return true.
 * @param pinpointStatus deployment state of the PinpointApp
 * @returns true if owned by Notifications
 */
export const isPinpointAppOwnedByNotifications = (pinpointStatus: IPinpointDeploymentStatus): boolean =>
  pinpointStatus === IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM;

/**
 * Helper function to normalize Notifications Pinpoint App to Analytics result
 * - This function will be removed once all Analytics and Notifications meta is normalized
 * @param pinpointApp - PinpointApp metadata extracted from Notifications
 * @param envName - environment of the amplify app.
 * @returns Pinpoint analytics resource metadata
 */
const buildAnalyticsResourceFromPinpointApp = (pinpointApp: ICategoryMeta, envName: string): IAnalyticsResource => {
  const regulatedResourceName: string = pinpointApp.regulatedResourceName || PinpointName.extractResourceName(pinpointApp.Name, envName);
  const analyticsResource: IAnalyticsResource = {
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
export const buildPinpointChannelResponseSuccess = (
  action: ChannelAction,
  deploymentType: ChannelConfigDeploymentType,
  channelName: string,
  output?: $TSAny,
): IChannelAPIResponse => ({
  action,
  channel: channelName,
  deploymentType,
  response: {
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    capability: AmplifyCategories.NOTIFICATIONS, // Notifications
    subCapability: channelName, // e.g SMS
    status: true, // true - successfully applied, false - failed to apply
  },
  output,
});

/**
 * Get Pinpoint app status from notifications meta ( in-core or in-file )
 * TBD: Move to NotificationsDB API
 * @param notificationsMeta - notificationsMeta from context (in-core)
 * @param amplifyMeta - amplify-meta from amplify-meta.json (in-file)
 * @param envName - application environment
 * @returns PinpointApp
 */
export const getPinpointAppStatusNotifications = (
  notificationsMeta: $TSAny,
  amplifyMeta: $TSAny,
  envName: string,
): ICategoryMeta | undefined => {
  const scanOptions: $TSAny = {
    isRegulatingResourceName: true,
    envName,
  };
  return notificationsMeta?.service === AmplifySupportedService.PINPOINT && notificationsMeta?.output
    ? notificationsMeta.output
    : scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], scanOptions);
};

/**
 * Check if PinpointApp is created in Analytics and/or Notifications.
 */
export const getPinpointAppStatus = async (
  context: $TSContext,
  amplifyMeta: $TSAny,
  pinpointNotificationsMeta: $TSAny,
  envName: string | undefined,
): Promise<IPinpointAppStatus> => {
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
    resultPinpointApp.status = resultPinpointApp.app.id
      ? IPinpointDeploymentStatus.APP_IS_DEPLOYED
      : IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED;
  }
  // Check if Notifications is using an App but different from Analytics - Legacy behavior
  const notificationsPinpointApp = getPinpointAppStatusNotifications(pinpointNotificationsMeta, amplifyMeta, envName);
  if (notificationsPinpointApp?.Id && notificationsPinpointApp.Id !== resultPinpointApp?.app?.id) {
    resultPinpointApp.status = IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM;
    resultPinpointApp.app = buildAnalyticsResourceFromPinpointApp(notificationsPinpointApp, envName);
  }
  return resultPinpointApp;
};

/**
 * Display 'amplify push' required prompt.
 * @param pinpointStatus - deployment status of the pinpoint app
 */
export const viewShowAmplifyPushRequired = (pinpointStatus: IPinpointDeploymentStatus): void => {
  let pinpointStatusMessage = '';
  switch (pinpointStatus) {
    case IPinpointDeploymentStatus.APP_NOT_CREATED:
      pinpointStatusMessage = 'Pinpoint resource is not created';
      break;
    case IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED:
      pinpointStatusMessage = 'Pinpoint resource is only locally created';
      break;
    case IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM:
      pinpointStatusMessage = 'Pinpoint resource is created outside of Amplify';
      break;
    case IPinpointDeploymentStatus.NO_ENV:
      pinpointStatusMessage = 'Pinpoint resource status is unknown';
      break;
    default:
      pinpointStatusMessage = 'Pinpoint resource is not initialized in this environment';
  }
  printer.warn(pinpointStatusMessage);
  if (
    pinpointStatus === IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED ||
    pinpointStatus === IPinpointDeploymentStatus.APP_NOT_CREATED
  ) {
    printer.warn('Run "amplify push" to deploy the Pinpoint resource and then retry...');
  }
};

/**
 * Get the PinpointApp from the Analytics resource.
 * @param analyticsMeta - Analytics meta
 * @returns PinpointApp metadata
 */
export const getPinpointAppFromAnalyticsOutput = (analyticsMeta: IAnalyticsResource): Partial<ICategoryMeta> => {
  const pinpointApp: Partial<ICategoryMeta> = {
    Id: analyticsMeta.id,
    Name: analyticsMeta.output.appName,
    Region: analyticsMeta.region,
    regulatedResourceName: analyticsMeta.resourceName,
  };
  return pinpointApp;
};

/**
 * Get PinpointApp from Analytics output and update context.
 */
export const updateContextFromAnalyticsOutput = async (
  context: $TSContext,
  amplifyMeta: $TSMeta,
  pinpointAppStatus: IPinpointAppStatus,
): Promise<Partial<ICategoryMeta> | undefined> => {
  if (pinpointAppStatus.app?.output && pinpointAppStatus.app?.resourceName) {
    const pinpointApp = getPinpointAppFromAnalyticsOutput(pinpointAppStatus.app);
    const resourceName = pinpointAppStatus.app.resourceName as string;
    // create updated version of amplify-meta with notifications resource
    context.exeInfo.amplifyMeta = constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
    // create updated version of backend-config with notifications resource configuration
    context.exeInfo.backendConfig = await addPartialNotificationsBackendConfig(resourceName, context.exeInfo.backendConfig);
    return pinpointApp;
  }
  return undefined;
};

/**
 * Create the PinpointApp through Analytics API.
 * @param context amplify cli context
 */
export const createAnalyticsPinpointApp = async (context: $TSContext): Promise<void> => {
  const pushResponse = await invokeAnalyticsPush(context, AmplifySupportedService.PINPOINT);
  if (!pushResponse.status) {
    throw new AmplifyFault('PushResourcesFault', {
      message: `Failed to create Pinpoint resource for the given environment: ${pushResponse.reasonMsg}`,
    });
  }
};

/**
 * Get the PinpointApp's deployment status from amplify-meta.json.
 * @param context amplify cli context
 * @param pinpointNotificationsMeta pinpoint notifications meta
 * @param appEnvName Application's environment name
 * @returns Pinpoint deployment status
 */
export const getPinpointAppStatusFromMeta = async (
  context: $TSContext,
  pinpointNotificationsMeta: INotificationsResourceMeta | undefined,
  appEnvName: string | undefined,
): Promise<IPinpointAppStatus> => {
  const amplifyMeta = context.exeInfo.amplifyMeta || stateManager.getMeta();
  const envName = appEnvName || stateManager.getCurrentEnvName();
  return getPinpointAppStatus(context, amplifyMeta, pinpointNotificationsMeta, envName);
};

/**
 * Push Auth and Pinpoint resources to the cloud.
 */
export const pushAuthAndAnalyticsPinpointResources = async (
  context: $TSContext,
  pinpointAppStatus: IPinpointAppStatus,
): Promise<IPinpointAppStatus> => {
  await createAnalyticsPinpointApp(context);
  return {
    ...pinpointAppStatus,
    status: IPinpointDeploymentStatus.APP_IS_DEPLOYED,
  };
};

/**
 * Ensure Pinpoint app exists
 */
export const ensurePinpointApp = async (
  context: $TSContext,
  pinpointNotificationsMeta: $TSAny,
  appStatus?: IPinpointAppStatus,
  appEnvName?: string,
): Promise<IPinpointAppStatus> => {
  let pinpointApp: Partial<ICategoryMeta> | undefined;
  let resourceName;
  const amplifyMeta = context.exeInfo.amplifyMeta || stateManager.getMeta();
  const envName: string = appEnvName || context.exeInfo.localEnvInfo.envName || stateManager.getCurrentEnvName() || '';
  const pinpointAppStatus = appStatus || (await getPinpointAppStatus(context, amplifyMeta, pinpointNotificationsMeta, envName));
  switch (pinpointAppStatus.status) {
    case IPinpointDeploymentStatus.NO_ENV: {
      printer.warn('Current ENV not configured!');
      return pinpointAppStatus;
    }
    case IPinpointDeploymentStatus.APP_IS_DEPLOYED_CUSTOM: {
      // This will always be true for DEPLOYED_CUSTOM since we do not allow custom
      // Pinpoint resource in Notifications category.
      if (pinpointAppStatus.app?.output && pinpointAppStatus.app?.resourceName) {
        pinpointApp = pinpointAppStatus.app?.output;
        resourceName = pinpointAppStatus.app?.resourceName;
        // Update pinpointApp into Notifications amplifyMeta (in-core)
        constructResourceMeta(amplifyMeta, resourceName, pinpointApp as ICategoryMeta);
      }
      break;
    }
    case IPinpointDeploymentStatus.APP_IS_DEPLOYED: {
      if (pinpointNotificationsMeta?.output) {
        pinpointApp = pinpointNotificationsMeta?.output as ICategoryMeta;
        pinpointApp.regulatedResourceName = PinpointName.extractResourceName(pinpointNotificationsMeta.Name, envName);
        resourceName = pinpointApp.regulatedResourceName; // Pinpoint name - envName;
        // Update pinpointApp into Notifications amplifyMeta (in-core)
        context.exeInfo.amplifyMeta = constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
      } else {
        // Pinpoint App is deployed but channels are not configured.
        // Sync Pinpoint resource from Analytics
        pinpointApp = await updateContextFromAnalyticsOutput(context, amplifyMeta, pinpointAppStatus);
        resourceName = pinpointAppStatus?.app?.resourceName;
        if (!resourceName) {
          throw new AmplifyFault('ResourceNotFoundFault', {
            message: `Pinpoint resource name is not found in amplify-meta.json : ${pinpointAppStatus?.app}`,
          });
        }
        // Update pinpointApp into Notifications amplifyMeta (in-core)
        context.exeInfo.amplifyMeta = constructResourceMeta(amplifyMeta, resourceName, pinpointApp as ICategoryMeta);
      }
      context.exeInfo.backendConfig = await addPartialNotificationsBackendConfig(resourceName, context.exeInfo.backendConfig);
      break;
    }
    case IPinpointDeploymentStatus.APP_NOT_CREATED: {
      // Create the Pinpoint resource if not yet created
      printer.warn('Adding notifications would add a Pinpoint resource from Analytics category if not already added');
      const resourceResult = await invokeAnalyticsAPICreateResource(context, AmplifySupportedService.PINPOINT);
      resourceName = resourceResult.resourceName;
      // create updated version of amplify-meta with notifications resource
      context.exeInfo.amplifyMeta = await addPartialNotificationsAppMeta(context, resourceName);
      // create updated version of backend-config with notifications resource configuration
      context.exeInfo.backendConfig = await addPartialNotificationsBackendConfig(resourceName, context.exeInfo.backendConfig);
      // The Pinpoint resource is locally created, but requires an amplify push for channels to be programmed
      // note:- This is temporary until deployment state-machine supports deferred resource push.
      viewShowAmplifyPushRequired(pinpointAppStatus.status);
      break;
    }
    case IPinpointDeploymentStatus.APP_IS_CREATED_NOT_DEPLOYED: {
      resourceName = pinpointAppStatus.app?.resourceName;
      if (resourceName) {
        // create updated version of amplify-meta with notifications resource
        context.exeInfo.amplifyMeta = await addPartialNotificationsAppMeta(context, resourceName);
        // create updated version of backend-config with notifications resource configuration
        context.exeInfo.backendConfig = await addPartialNotificationsBackendConfig(resourceName, context.exeInfo.backendConfig);
      }
      viewShowAmplifyPushRequired(pinpointAppStatus.status);
      break;
    }
    default:
      throw new AmplifyError('ConfigurationError', {
        message: `Invalid Pinpoint App Status ${pinpointAppStatus.status} : App: ${pinpointAppStatus.app}`,
      });
  }

  if (resourceName && context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS]) {
    context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName];
    context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
  }

  pinpointAppStatus.context = context;
  return pinpointAppStatus; // must have amplify-meta and backend-config updated
};

/**
 * Delete Pinpoint App
 */
export const deletePinpointApp = async (context: $TSContext): Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);

  if (pinpointApp) {
    await authHelper.deleteRolePolicy(context);
    pinpointApp = (await deleteApp(context, pinpointApp.Id)) as ICategoryMeta;
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], pinpointApp.Id);
  }
};

/**
 * Scan AmplifyMeta for given category (Legacy - needs refactor)
 * @param categoryMeta - CategoryMeta is updated if CLI is regulating pinpoint resource name
 * @param options - amplify cli options
 */
export const scanCategoryMetaForPinpoint = (categoryMeta: $TSAny, options: $TSAny): ICategoryMeta | undefined => {
  let result: ICategoryMeta | undefined;
  if (categoryMeta) {
    const resources = Object.keys(categoryMeta);
    for (const resourceName of resources) {
      const serviceMeta = categoryMeta[resourceName];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
          Name: serviceMeta.output.Name || serviceMeta.output.appName,
          Region: serviceMeta.output.Region,
          lastPushTimeStamp: serviceMeta.lastPushTimeStamp,
        };

        if (options && options.isRegulatingResourceName) {
          const regulatedResourceName = PinpointName.extractResourceName(result.Name, options.envName);
          // eslint-disable-next-line no-param-reassign
          options.regulatedResourceName = regulatedResourceName;
          // eslint-disable-next-line max-depth
          if (resourceName !== regulatedResourceName) {
            // eslint-disable-next-line no-param-reassign
            categoryMeta[regulatedResourceName] = serviceMeta;
            // eslint-disable-next-line no-param-reassign
            delete categoryMeta[resourceName];
          }
        }
        break;
      }
    }
  }

  return result;
};

const removeCategoryMetaForPinpoint = (categoryMeta: $TSAny, pinpointAppId: string): void => {
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id === pinpointAppId) {
        // eslint-disable-next-line no-param-reassign
        delete categoryMeta[service];
      }
    }
  }
};

const deleteApp = async (context: $TSContext, pinpointAppId: string): Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pinpointClient = await getPinpointClient(context, AmplifyCategories.NOTIFICATIONS, 'delete', envName);
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
        // eslint-disable-next-line no-param-reassign
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
};

/**
 * Open the AWS console in the browser for the given service.
 */
export const console = async (context: $TSContext): Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  if (pinpointApp) {
    const { Id, Region } = pinpointApp;
    const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/settings`;
    await open(consoleUrl, { wait: false });
  } else {
    printer.error('Neither notifications nor analytics is enabled in the cloud.');
  }
};

const getConfiguredCredentials = async (context: $TSContext, envName?: string): Promise<{ region?: string } | undefined> => {
  try {
    if (envName) {
      return loadConfigurationForEnv(context, envName);
    } else {
      return loadConfiguration(context);
    }
  } catch (e) {
    // ignore missing config
    return undefined;
  }
};

export const getPinpointClient = async (context: $TSContext, category: string, action?: string, envName?: string): Promise<Pinpoint> => {
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const cred = await getConfiguredCredentials(context, envName);

  const amplifyMeta = stateManager.getMeta();
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);

  category = category || 'missing';
  action = action || 'missing';
  const userAgentAction = `${category}:${action}`;
  const defaultOptions = {
    region: pinpointApp?.Region ?? (await mapServiceRegion(context, cred?.region || resolveRegion())),
    customUserAgent: formUserAgentParam(context, userAgentAction),
  };
  let httpAgent = undefined;

  // HTTP_PROXY & HTTPS_PROXY env vars are read automatically by ProxyAgent, but we check to see if they are set before using the proxy
  if (httpProxy) {
    httpAgent = new ProxyAgent();
  }

  return new Pinpoint({ ...cred, ...defaultOptions, httpOptions: { agent: httpAgent } });
};

export const mapServiceRegion = async (context: $TSContext, region: string): Promise<string> => {
  const serviceRegionMap = await invokeAnalyticsGetPinpointRegionMapping(context);
  if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
  }
  return defaultPinpointRegion;
};

/**
 * Check if Analytics has been enabled
 */
export const isAnalyticsAdded = (context: $TSContext): boolean => {
  const { amplifyMeta } = context.exeInfo;
  return !!scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
};
