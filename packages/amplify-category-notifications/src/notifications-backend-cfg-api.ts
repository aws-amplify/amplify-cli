/**
 *  API to update Notifications category state in the state-db ( backend-config, frontend-config, teams-provider, amplify-meta)
 */
import { $TSAny, pathManager, stateManager, AmplifySupportedService, AmplifyCategories, $TSContext } from '@aws-amplify/amplify-cli-core';
import { INotificationsResourceBackendConfig, INotificationsResourceBackendConfigValue } from './notifications-backend-cfg-types';

/**
 * Get Notifications App from 'notifications' category  of backend-config.json
 * @param backendConfig optionally provide backendConfig object read from the file.
 * @returns Notifications meta partially defined in INotificationsResourceMeta
 */
export const getNotificationsAppConfig = async (backendConfig?: $TSAny): Promise<INotificationsResourceBackendConfig | undefined> => {
  const notificationConfigList = await getNotificationsAppConfigList(backendConfig);
  if (notificationConfigList) {
    return notificationConfigList[0];
  }
  return undefined;
};

/**
 * Get Deployed Notifications App from 'notifications' category  of backend-config.json
 * @param currentBackendConfig optionally provide backendConfig object read from the file.
 * @returns Notifications meta partially defined in INotificationsResourceMeta
 */
export const getCurrentNotificationsAppConfig = async (
  currentBackendConfig?: $TSAny,
): Promise<INotificationsResourceBackendConfig | undefined> =>
  // note:- passing falsy to getNotificationsAppConfig will fetch the BackendConfig. We only want the CurrentBackendConfig.
  currentBackendConfig ? getNotificationsAppConfig(currentBackendConfig) : undefined;

/**
 * Check if notification resource has been created in backend-config
 * @param resourceBackendConfig - Backend config for the given pinpoint resource from backend-config.json
 * @returns true if Pinpoint resource has been created in backend-config
 */
export const isNotificationsResourceCreatedInBackendConfig = (resourceBackendConfig: INotificationsResourceBackendConfig): boolean =>
  resourceBackendConfig.service === AmplifySupportedService.PINPOINT;

/**
 * Create a new Pinpoint resource in backend-config for Notifications category.
 * @param pinpointResourceName Name of the pinpoint resource from Analytics
 * @returns backendConfig for reference
 */
export const addPartialNotificationsBackendConfig = async (pinpointResourceName: string, backendConfig?: $TSAny): Promise<$TSAny> => {
  const projectPath = pathManager.findProjectRoot();
  const tmpBackendConfig = backendConfig || stateManager.getBackendConfig(projectPath);
  const emptyResourceConfig: INotificationsResourceBackendConfigValue = {
    service: AmplifySupportedService.PINPOINT,
    channels: [],
    channelConfig: {},
  };
  let notificationsConfig = tmpBackendConfig[AmplifyCategories.NOTIFICATIONS];

  notificationsConfig = notificationsConfig || {
    [pinpointResourceName]: emptyResourceConfig,
  };
  notificationsConfig[pinpointResourceName] = notificationsConfig[pinpointResourceName] || emptyResourceConfig;

  tmpBackendConfig[AmplifyCategories.NOTIFICATIONS] = notificationsConfig;
  return tmpBackendConfig;
};

/**
 * [Internal] Get the Notifications resources from backend-config.json
 * @returns List of Backend configs
 */
const getNotificationsAppConfigList = async (backendConfig?: $TSAny, appName?: string): Promise<INotificationsResourceBackendConfig[]> => {
  const tmpBackendConfig = backendConfig || stateManager.getBackendConfig();
  const notificationsConfig = tmpBackendConfig[AmplifyCategories.NOTIFICATIONS];
  const notificationsConfigList: Array<INotificationsResourceBackendConfig> = [];
  if (notificationsConfig) {
    for (const resourceName of Object.keys(notificationsConfig)) {
      // !appName => get all resources,
      // appName === resourceName => get only the Pinpoint resource used by Notifications
      // and ignore other resources.
      if (!appName || appName === resourceName) {
        notificationsConfigList.push({
          ...(notificationsConfig[resourceName] as INotificationsResourceBackendConfigValue),
          serviceName: resourceName,
        });
      }
    }
  }
  return notificationsConfigList;
};

/**
 * Remove the Notifications category from BackendConfig
 * @param context amplify cli context
 * @returns amplify cli context (with no Notifications category in BackendConfig)
 */
export const removeNotificationsAppConfig = async (context: $TSContext): Promise<$TSContext> => {
  const backendConfig = context.exeInfo.backendConfig || stateManager.getBackendConfig();
  if (AmplifyCategories.NOTIFICATIONS in backendConfig) {
    delete backendConfig[AmplifyCategories.NOTIFICATIONS];
  }
  context.exeInfo.backendConfig = backendConfig;
  return context;
};
