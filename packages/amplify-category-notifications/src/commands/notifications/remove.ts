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
import { notificationsAPIRemoveApp } from '../../notifications-resource-api';

const CANCEL = 'Cancel';

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

  const availableChannelViewNames = NotificationsDB.ChannelAPI.getAvailableChannelViewNames();
  const enabledChannelViewNames = await NotificationsDB.ChannelAPI.getEnabledChannelViewNames(notificationConfig);
  const PinpointAppViewName = `Pinpoint application: ${chalk.cyan.bold(notificationConfig.serviceName)}`;
  const optionChannelViewNames = [...enabledChannelViewNames, PinpointAppViewName, CANCEL];

  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? NotificationsDB.ChannelAPI.getChannelViewName(channelName) : undefined;

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose what to remove.',
      choices: optionChannelViewNames,
      default: optionChannelViewNames[0],
    });
    channelViewName = answer.selection;
  } else if (!optionChannelViewNames.includes(channelViewName)) {
    context.print.info(`The ${channelViewName} channel has NOT been enabled.`);
    channelViewName = undefined;
  }

  if (channelViewName && channelViewName !== CANCEL) {
    const pinpointAppStatus = await getPinpointAppStatus(context, context.exeInfo.amplifyMeta,
      notificationsMeta, envName);
    if (channelViewName !== PinpointAppViewName) {
      const selectedChannelName = NotificationsDB.ChannelAPI.getChannelNameFromView(channelViewName);
      // a channel can only be disabled if the PinpointApp exists
      await pinpointHelper.ensurePinpointApp(context, undefined, pinpointAppStatus, envName);
      if (isPinpointAppDeployed(pinpointAppStatus.status)
      || NotificationsDB.ChannelAPI.isChannelDeploymentDeferred(selectedChannelName)) {
        const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.disableChannel(context, selectedChannelName);
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
      await notificationsAPIRemoveApp(context);
      // Pinpoint App is not owned by Notifications
      context.print.success('All notifications have been disabled');
      context.print.warning(`${PinpointAppViewName} is provisioned through analytics`);
      context.print.warning(`Next step: Run "amplify analytics remove" and select the ${PinpointAppViewName} to remove`);
    }
  }
  return context;
};

module.exports = {
  name: 'remove',
  alias: ['disable', 'delete'],
  run,
};
