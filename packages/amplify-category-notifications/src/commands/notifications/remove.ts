import inquirer from 'inquirer';
import { $TSContext, AmplifyCategories, stateManager } from 'amplify-cli-core';
import chalk from 'chalk';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import * as multiEnvManager from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../channel-types';
import { Notifications } from '../../notifications-api';
import { getPinpointAppStatus, isPinpointAppDeployed, isPinpointAppOwnedByNotifications } from '../../pinpoint-helper';
import { notificationsAPIRemoveApp } from '../../plugin-provider-api-notifications';

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
  const notificationConfig = await Notifications.Cfg.getNotificationsAppConfig(context.exeInfo.backendConfig);
  if (!notificationConfig) {
    context.print.error('Notifications have not been added to your project.');
    return context;
  }

  if (await Notifications.Meta.checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    context.print.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }

  const availableChannelViewNames = Notifications.ChannelCfg.getAvailableChannelViewNames();
  const enabledChannelViewNames = await Notifications.ChannelCfg.getEnabledChannelViewNames(notificationConfig);
  const PinpointAppViewName = `All channels on Pinpoint resource : ${chalk.cyan.bold(notificationConfig.serviceName)}`;
  const optionChannelViewNames = [...enabledChannelViewNames, PinpointAppViewName, CANCEL];

  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? Notifications.ChannelCfg.getChannelViewName(channelName) : undefined;

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
      const selectedChannelName = Notifications.ChannelCfg.getChannelNameFromView(channelViewName);
      // a channel can only be disabled if the PinpointApp exists
      await pinpointHelper.ensurePinpointApp(context, undefined, pinpointAppStatus, envName);
      if (isPinpointAppDeployed(pinpointAppStatus.status)
      || Notifications.ChannelCfg.isChannelDeploymentDeferred(selectedChannelName)) {
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
