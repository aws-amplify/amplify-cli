/* eslint-disable spellcheck/spell-checker */
import * as fs from 'fs-extra';
import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, stateManager, AmplifyCategories, AmplifySupportedService, pathManager,
} from 'amplify-cli-core';
import _ from 'lodash';
import * as authHelper from './auth-helper';
import {
  ensurePinpointApp,
  getPinpointClient,
  scanCategoryMetaForPinpoint,
} from './pinpoint-helper';
import * as notificationManager from './notifications-manager';

/**
 * Create Pinpoint resource in Analytics, Create Pinpoint Meta for Notifications category and
 * update configuration for enabling/disabling channels.
 * note:- The last step of enabling-disabling channels will be combined with creating Pinpoint
 * resource in Analytics once all changes are in CFN
 * @param context amplify cli context
 * @returns Pinpoint notifications metadata
 */
export const initEnv = async (context: $TSContext):Promise<$TSAny> => {
  const pinpointNotificationsMeta = await constructPinpointNotificationsMeta(context);
  if (pinpointNotificationsMeta) {
    // remove this line after init and init-push are separated.
    await pushChanges(context, pinpointNotificationsMeta);
    await writeData(context);
  }
  return pinpointNotificationsMeta;
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
      const notificationsMeta = currentAmplifyMeta[AmplifyCategories.NOTIFICATIONS];

      // We only support single resource for notificaitons
      if (notificationsMeta && Object.keys(notificationsMeta).length > 0) {
        const pinpointResource = _.get(notificationsMeta, Object.keys(notificationsMeta)[0], undefined);
        pinpointApp = {
          Id: pinpointResource.output.Id,
        };
        pinpointApp.Name = pinpointResource.output.Name || pinpointResource.output.appName;
        pinpointApp.Region = pinpointResource.output.Region;
      }
    }
  }

  const { teamProviderInfo, localEnvInfo, amplifyMeta } = context.exeInfo;

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
    const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath();
    const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);
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
      };
    }

    if (serviceBackendConfig) {
      if (pinpointNotificationsMeta) {
        pinpointNotificationsMeta.channels = serviceBackendConfig.channels;
      } else {
        pinpointNotificationsMeta = serviceBackendConfig;
      }
    }

    return pinpointNotificationsMeta;
  }

  return undefined;
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
};

const pushChanges = async (context: $TSContext, pinpointNotificationsMeta: $TSAny):Promise<void> => {
  const availableChannels = notificationManager.getAvailableChannels();
  let pinpointInputParams : $TSAny;
  if (
    context.exeInfo
    && context.exeInfo.inputParams
    && context.exeInfo.inputParams.categories
    && context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS]
    && context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT]
  ) {
    pinpointInputParams = context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
    context.exeInfo.pinpointInputParams = pinpointInputParams;
  }
  const channelsToEnable : Array<string> = [];
  const channelsToDisable : Array<string> = [];
  // const channelsToUpdate = [];

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

    // if (isCurrentlyEnabled && needToBeEnabled) {
    //   channelsToUpdate.push(channel);
    // }
    if (isCurrentlyEnabled && !needToBeEnabled) {
      channelsToDisable.push(channel);
    } else if (!isCurrentlyEnabled && needToBeEnabled) {
      channelsToEnable.push(channel);
    }
  });

  await ensurePinpointApp(context, pinpointNotificationsMeta);

  const tasks: Array<$TSAny> = [];
  channelsToEnable.forEach(channel => {
    tasks.push(() => notificationManager.enableChannel(context, channel));
  });
  channelsToDisable.forEach(channel => {
    tasks.push(() => notificationManager.disableChannel(context, channel));
  });
  // channelsToUpdate.forEach((channel) => {
  //   tasks.push(() => notificationManager.configureChannel(context, channel));
  // });

  await sequential(tasks);
};

const getPinpointResourceNameFromBackendConfig = (backendConfig: $TSAny): string => {
  const analyticsResources = backendConfig[AmplifyCategories.ANALYTICS];
  if (!analyticsResources) {
    throw new Error('No Analytics resources found');
  }
  for (const resourceName of Object.keys(analyticsResources)) {
    if (analyticsResources[resourceName].service === AmplifySupportedService.PINPOINT) {
      return resourceName;
    }
  }
  throw new Error('No Pinpoint resource found');
};

/**
 * Updates notification channel for pinpoint resource in backendConfig
 * @param channelName Name of Pinpoint notification channel to toggle
 */
export const toggleChannelBackendConfig = async (channelName: string):Promise<void> => {
  const backendConfig = await stateManager.getBackendConfig();
  const pinpointResourceName = getPinpointResourceNameFromBackendConfig(backendConfig);
  console.log('SACPCDEBUG: toggleChannelBackendConfig : pinpoint name: ', pinpointResourceName, JSON.stringify(backendConfig, null, 2));
  // if exists , then remove , else add
  if (!backendConfig[AmplifyCategories.NOTIFICATIONS]) {
    backendConfig[AmplifyCategories.NOTIFICATIONS] = {
      [pinpointResourceName]: { Service: AmplifySupportedService.PINPOINT, channels: [channelName] },
    };
  } else if (!backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels) {
    backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels = [channelName];
  } else if (backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels.includes(channelName)) {
    // remove from list
    const { channels } = backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName];
    backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels = channels.filter((ch: string) => ch !== channelName);
    console.log(`SACPCDEBUG: toggleChannelBackendConfig : Removed ${channelName} pinpoint name: `, pinpointResourceName);
  } else {
    // add to list
    backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels.push(channelName);
    console.log(`SACPCDEBUG: toggleChannelBackendConfig : Added to ${backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName]} Channels:`,
      backendConfig[AmplifyCategories.NOTIFICATIONS][pinpointResourceName].channels);
  }
  console.log(`SACPCDEBUG: toggleChannelBackendConfig : Added ${channelName} Channels:`,
    backendConfig[AmplifyCategories.NOTIFICATIONS]);
  stateManager.setBackendConfig(undefined, backendConfig);
};

/**
 * write TeamProviderInfo, BackendConfig and AmplifyMeta files
 * @param context amplify-cli context
 */
export const writeData = async (context: $TSContext):Promise<void> => {
  const amplifyMeta = stateManager.getMeta();
  const categoryMeta = amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  let pinpointMeta;
  if (categoryMeta) {
    const availableChannels = notificationManager.getAvailableChannels();
    const enabledChannels: Array<string> = [];
    const resources = Object.keys(categoryMeta);
    for (let i = 0; i < resources.length; i++) {
      const serviceMeta = categoryMeta[resources[i]];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        availableChannels.forEach(channel => {
          if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
            enabledChannels.push(channel);
          }
        });
        pinpointMeta = {
          serviceName: resources[i],
          service: serviceMeta.service,
          channels: enabledChannels,
          Name: serviceMeta.output.Name,
          Id: serviceMeta.output.Id,
          Region: serviceMeta.output.Region,
        };
        break;
      }
    }
  }
  // TODO: move writing to files logic to the cli core when those are ready
  writeTeamProviderInfo(pinpointMeta, context); // update Pinpoint data
  writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getBackendConfigFilePath());
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  /** SACPCDEBUG - disable updating Amplify-meta for notifications - only update params in analytics.
  writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getCurrentBackendConfigFilePath());
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getCurrentAmplifyMetaFilePath());
  await context.amplify.storeCurrentCloudBackend();
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
  **/
};

const writeTeamProviderInfo = (pinpointMeta:$TSAny, context:$TSContext):void => {
  const teamProviderInfoFilePath : string = context.amplify.pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilePath)) {
    const { envName } = context.exeInfo.localEnvInfo;
    const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoFilePath);
    teamProviderInfo[envName] = teamProviderInfo[envName] || {};
    teamProviderInfo[envName].categories = teamProviderInfo[envName].categories || {};
    teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS] = teamProviderInfo[envName]
      .categories[AmplifyCategories.NOTIFICATIONS] || {};
    teamProviderInfo[envName].categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT] = pinpointMeta
      ? {
        Name: pinpointMeta.Name,
        Id: pinpointMeta.Id,
        Region: pinpointMeta.Region,
      }
      : undefined;
    const jsonString = JSON.stringify(teamProviderInfo, null, 4);
    fs.writeFileSync(teamProviderInfoFilePath, jsonString, 'utf8');
  }
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
    const availableChannels = notificationManager.getAvailableChannels();
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
  toggleChannelBackendConfig,
  writeData,
  migrate,
};
