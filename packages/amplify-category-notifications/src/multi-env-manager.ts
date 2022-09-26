import {
  $TSAny,
  $TSContext, $TSMeta, AmplifyCategories, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';

/* eslint-disable */
import fs from 'fs-extra';
import _ from 'lodash';
import sequential from 'promise-sequential';
import { deleteRolePolicy } from './auth-helper';
import { ensurePinpointApp, getPinpointClient, scanCategoryMetaForPinpoint } from './pinpoint-helper';
import { ChannelWorkersKeys, disableChannel, enableChannel, getAvailableChannels, pullAllChannels } from './notifications-manager';
import { ensureEnvParamManager, getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { printer } from 'amplify-prompts';

export const initEnv = async (context: $TSContext) => {
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

      // We only support single resource for notifications
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
    teamProviderInfo?.[envName]?.categories?.[AmplifyCategories.NOTIFICATIONS]?.[AmplifySupportedService.PINPOINT]?.Id
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
      for (const resource of resources) {
        serviceBackendConfig = categoryConfig[resource];
        if (serviceBackendConfig.service === AmplifySupportedService.PINPOINT) {
          serviceBackendConfig.resourceName = resource;
          break;
        }
      }
    }

    if (pinpointApp) {
      await pullAllChannels(context, pinpointApp);
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
 export const deletePinpointAppForEnv = async (context: $TSContext, envName: string): Promise<$TSAny> => {
  const paramManager = (await ensureEnvParamManager(envName)).instance;
  let pinpointApp: $TSAny = undefined;
  if (paramManager.hasResourceParamManager(AmplifyCategories.NOTIFICATIONS, AmplifySupportedService.PINPOINT)) {
    pinpointApp = paramManager.getResourceParamManager(AmplifyCategories.NOTIFICATIONS, AmplifySupportedService.PINPOINT).getAllParams();
  }

  if (pinpointApp) {
    const params = {
      ApplicationId: pinpointApp.Id,
    };
    const pinpointClient = await getPinpointClient(context, 'delete', envName);

    await deleteRolePolicy(context);
    return pinpointClient
      .deleteApp(params)
      .promise()
      .then(() => {
        printer.success(`Successfully deleted Pinpoint project: ${pinpointApp.Id}`);
      })
      .catch((err : $TSAny) => {
        // awscloudformation might have already removed the pinpoint project
        if (err.code === 'NotFoundException') {
          printer.warn(`${pinpointApp.Id}: not found`);
        } else {
          printer.error(`Failed to delete Pinpoint project: ${pinpointApp.Id}`);
          throw err;
        }
      });
  }
};

const pushChanges = async (context: $TSContext, pinpointNotificationsMeta: $TSMeta) =>{
  const availableChannels = getAvailableChannels();
  let pinpointInputParams : $TSAny;
  if (
    context.exeInfo?.inputParams?.categories?.[AmplifyCategories.NOTIFICATIONS]?.[AmplifySupportedService.PINPOINT]
  ) {
    pinpointInputParams = context.exeInfo.inputParams.categories[AmplifyCategories.NOTIFICATIONS][AmplifySupportedService.PINPOINT];
    context.exeInfo.pinpointInputParams = pinpointInputParams;
  }
  const channelsToEnable: ChannelWorkersKeys[] = [];
  const channelsToDisable: ChannelWorkersKeys[] = [];
  // const channelsToUpdate = [];

  availableChannels.forEach(channel => {
    let isCurrentlyEnabled = false;
    let needToBeEnabled = false;
    if (pinpointNotificationsMeta.output?.Id && pinpointNotificationsMeta.output[channel]?.Enabled) {
      isCurrentlyEnabled = true;
    }

    if (pinpointNotificationsMeta.channels?.includes(channel)) {
      needToBeEnabled = true;
    }

    if (
      pinpointInputParams?.[channel] &&
      Object.prototype.hasOwnProperty.call(pinpointInputParams[channel], 'Enabled')
    ) {
      needToBeEnabled = pinpointInputParams[channel].Enabled;
    }

    if (isCurrentlyEnabled && !needToBeEnabled) {
      channelsToDisable.push(channel);
    } else if (!isCurrentlyEnabled && needToBeEnabled) {
      channelsToEnable.push(channel);
    }
  });

  await ensurePinpointApp(context, pinpointNotificationsMeta);

  const tasks: (() => Promise<$TSAny>)[] = [];
  channelsToEnable.forEach(channel => {
    tasks.push(() => enableChannel(context, channel));
  });
  channelsToDisable.forEach(channel => {
    tasks.push(() => disableChannel(context, channel));
  });

  await sequential(tasks);
}

export const writeData = async (context: $TSContext) => {
  const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  let pinpointMeta;
  if (categoryMeta) {
    const availableChannels = getAvailableChannels();
    const enabledChannels: ChannelWorkersKeys[] = [];
    const resources = Object.keys(categoryMeta);
    for (const resource of resources) {
      const serviceMeta = categoryMeta[resource];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        availableChannels.forEach(channel => {
          if (serviceMeta.output[channel]?.Enabled) {
            enabledChannels.push(channel);
          }
        });
        pinpointMeta = {
          serviceName: resource,
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
  await ensureEnvParamManager();
  writeTeamProviderInfo(pinpointMeta);
  writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getBackendConfigFilePath());
  writeBackendConfig(context, pinpointMeta, context.amplify.pathManager.getCurrentBackendConfigFilePath());
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
  writeAmplifyMeta(context, categoryMeta, context.amplify.pathManager.getCurrentAmplifyMetaFilePath());
  await context.amplify.storeCurrentCloudBackend(context);
  await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
};

const writeTeamProviderInfo = (pinpointMeta:$TSAny): void => {
  if (!pinpointMeta) {
    return;
  }
  getEnvParamManager().getResourceParamManager(AmplifyCategories.NOTIFICATIONS, AmplifySupportedService.PINPOINT).setAllParams({
    Name: pinpointMeta.Name,
    Id: pinpointMeta.Id,
    Region: pinpointMeta.Region,
  });
};

const writeBackendConfig = (context: $TSContext, pinpointMeta: $TSAny, backendConfigFilePath: string):void => {
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

    const jsonString = JSON.stringify(backendConfig, null, 4);
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
};

const writeAmplifyMeta = (context: $TSContext, categoryMeta: $TSMeta, amplifyMetaFilePath: string) => {
  if (fs.existsSync(amplifyMetaFilePath)) {
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    amplifyMeta[AmplifyCategories.NOTIFICATIONS] = categoryMeta;
    const jsonString = JSON.stringify(amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  }
};

export const migrate = async (context: $TSContext) => {
  const migrationInfo = extractMigrationInfo(context);
  fillBackendConfig(context, migrationInfo);
  fillTeamProviderInfo(context, migrationInfo);
};

const extractMigrationInfo = (context: $TSContext): $TSAny => {
  let migrationInfo : $TSAny;
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

  if (migrationInfo?.output && migrationInfo.output.Id) {
    migrationInfo.Id = migrationInfo.output.Id;
    migrationInfo.Name = migrationInfo.output.Name;
    migrationInfo.Region = migrationInfo.output.Region;
    migrationInfo.channels = [];
    const availableChannels = getAvailableChannels();
    availableChannels.forEach(channel => {
      if (migrationInfo.output[channel] && migrationInfo.output[channel].Enabled) {
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
    Object.assign(context.migrationInfo.backendConfig[AmplifyCategories.NOTIFICATIONS], backendConfig);
  }
};

const fillTeamProviderInfo = (context: $TSContext, migrationInfo: $TSAny) => {
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

    Object.assign(teamProviderInfo[migrationInfo.envName].categories, categoryTeamInfo);
  }
};
