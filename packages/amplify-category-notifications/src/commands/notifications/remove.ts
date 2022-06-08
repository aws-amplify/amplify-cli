import inquirer from 'inquirer';
import { $TSContext, AmplifyCategories, stateManager } from 'amplify-cli-core';
import chalk from 'chalk';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import * as multiEnvManager from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../notifications-api-types';
import { NotificationsDB } from '../../notifications-backend-cfg-api';
import { NotificationsMeta } from '../../notifications-meta-api';
import { getPinpointAppStatus, isPinpointAppDeployed, isPinpointAppOwnedByNotifications } from '../../pinpoint-helper';

const CANCEL = 'Cancel';

/**
 * Runs delete for all channels and then removes the Notifications category config from backendConfig.
 * @param context amplify cli context
 * @returns updated amplify cli context
 */
const deleteNotificationsApp = async (context:$TSContext): Promise<$TSContext> => {
  const channelAPIResponseList:IChannelAPIResponse[] = await notificationManager.disableAllChannels(context);
  for (const channelAPIResponse of channelAPIResponseList) {
    await multiEnvManager.writeData(context, channelAPIResponse);
  }
  await notificationManager.removeEmptyNotificationsApp(context);
  await multiEnvManager.writeData(context, undefined);
  return context;
};

/**
 * Remove walkthrough for notifications resource
 * @param context amplify cli context
 * @returns amplify cli context with updated notifications metadata
 */
export const run = async (context:$TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const envName = stateManager.getCurrentEnvName();
  const notificationsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  const notificationConfig = await NotificationsDB.getNotificationsAppConfig(context.exeInfo.backendConfig);
  if (!notificationConfig) {
    context.print.error('Notifications have not been added to your project.');
    return context;
  }

  if (await NotificationsMeta.checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    context.print.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }
  const availableChannels = NotificationsDB.ChannelAPI.getAvailableChannels();
  const enabledChannels = await NotificationsDB.getEnabledChannelsFromBackendConfig(notificationConfig);
  const DELETE_PINPOINT_APP = `Pinpoint Application: ${chalk.blue(notificationConfig.serviceName)}`;
  const optionChannels = [...enabledChannels, DELETE_PINPOINT_APP, CANCEL];

  let channelName = context.parameters.first;

  if (!channelName || !availableChannels.includes(channelName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose what to remove.',
      choices: optionChannels,
      default: optionChannels[0],
    });
    channelName = answer.selection;
  } else if (!optionChannels.includes(channelName)) {
    context.print.info(`The ${channelName} channel has NOT been enabled.`);
    channelName = undefined;
  }

  if (channelName && channelName !== CANCEL) {
    const pinpointAppStatus = await getPinpointAppStatus(context, context.exeInfo.amplifyMeta,
      notificationsMeta, envName);
    if (channelName !== DELETE_PINPOINT_APP) {
      // a channel can only be disabled if the PinpointApp exists
      await pinpointHelper.ensurePinpointApp(context, undefined, pinpointAppStatus, envName);
      if (isPinpointAppDeployed(pinpointAppStatus.status)
      || NotificationsDB.ChannelAPI.isChannelDeploymentDeferred(channelName)) {
        const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.disableChannel(context, channelName);
        await multiEnvManager.writeData(context, channelAPIResponse);
      }
    } else if (isPinpointAppOwnedByNotifications(pinpointAppStatus.status)) {
      const answer = await inquirer.prompt({
        name: 'deletePinpointApp',
        type: 'confirm',
        message: 'Confirm that you want to delete the associated Amazon Pinpoint application',
        default: false,
      });
      if (answer.deletePinpointApp) {
        await pinpointHelper.deletePinpointApp(context);
        context.print.info('The Pinpoint application has been successfully deleted.');
        await multiEnvManager.writeData(context, undefined);
      }
    } else {
      await pinpointHelper.ensurePinpointApp(context, notificationsMeta, pinpointAppStatus, envName);
      context.print.info('Disabling all notifications from the Pinpoint resource');
      await deleteNotificationsApp(context);
      // Pinpoint App is not owned by Notifications
      context.print.success('All notifications have been disabled');
      context.print.info(`${DELETE_PINPOINT_APP} is provisioned through analytics`);
      context.print.info(`Run "amplify analytics remove" and select ${DELETE_PINPOINT_APP} to remove the Pinpoint resource`);
    }
  }
  return context;
};

module.exports = {
  name: 'remove',
  alias: ['disable', 'delete'],
  run,
};
