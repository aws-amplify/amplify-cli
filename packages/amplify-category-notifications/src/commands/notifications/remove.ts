import inquirer from 'inquirer';
import { $TSContext, AmplifyCategories, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import chalk from 'chalk';
import { IChannelAPIResponse } from '../../channel-types';
import {
  deletePinpointApp, ensurePinpointApp, getPinpointAppStatus, isPinpointAppDeployed, isPinpointAppOwnedByNotifications,
} from '../../pinpoint-helper';
import { notificationsAPIRemoveApp } from '../../plugin-provider-api-notifications';
import { writeData } from '../../multi-env-manager-utils';
import {
  getAvailableChannelViewNames, getChannelNameFromView, getChannelViewName, getEnabledChannelViewNames, isChannelDeploymentDeferred,
} from '../../notifications-backend-cfg-channel-api';
import { checkMigratedFromMobileHub } from '../../notifications-amplify-meta-api';
import { getNotificationsAppConfig } from '../../notifications-backend-cfg-api';
import { disableChannel } from '../../notifications-manager';

const CANCEL = 'Cancel';

export const name = 'remove';
export const alias = ['disable', 'delete'];

/**
 * Remove walkthrough for notifications resource
 * @param context amplify cli context
 * @returns amplify cli context with updated notifications metadata
 */
export const run = async (context: $TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const envName = stateManager.getCurrentEnvName();
  const notificationsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  const notificationConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
  if (!notificationConfig) {
    printer.error('Notifications have not been added to your project.');
    return context;
  }

  if (await checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    printer.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }

  const availableChannelViewNames = getAvailableChannelViewNames();
  const enabledChannelViewNames = await getEnabledChannelViewNames(notificationConfig);
  const PinpointAppViewName = `All channels on Pinpoint resource : ${chalk.cyan.bold(notificationConfig.serviceName)}`;
  const optionChannelViewNames = [...enabledChannelViewNames, PinpointAppViewName, CANCEL];

  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? getChannelViewName(channelName) : undefined;

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
    printer.info(`The ${channelViewName} channel has NOT been enabled.`);
    channelViewName = undefined;
  }

  if (channelViewName && channelViewName !== CANCEL) {
    const pinpointAppStatus = await getPinpointAppStatus(context, context.exeInfo.amplifyMeta,
      notificationsMeta, envName);
    if (channelViewName !== PinpointAppViewName) {
      const selectedChannelName = getChannelNameFromView(channelViewName);
      // a channel can only be disabled if the PinpointApp exists
      await ensurePinpointApp(context, undefined, pinpointAppStatus, envName);
      if (isPinpointAppDeployed(pinpointAppStatus.status) || isChannelDeploymentDeferred(selectedChannelName)) {
        const channelAPIResponse : IChannelAPIResponse|undefined = await disableChannel(context, selectedChannelName);
        await writeData(context, channelAPIResponse);
      }
    } else if (isPinpointAppOwnedByNotifications(pinpointAppStatus.status)) {
      const answer = await inquirer.prompt({
        name: 'deletePinpointApp',
        type: 'confirm',
        message: 'Confirm that you want to delete the associated Amazon Pinpoint application',
        default: false,
      });
      if (answer.deletePinpointApp) {
        await deletePinpointApp(context);
        printer.info('The Pinpoint application has been successfully deleted.');
        await writeData(context, undefined);
      }
    } else {
      await ensurePinpointApp(context, notificationsMeta, pinpointAppStatus, envName);
      printer.info('Disabling all notifications from the Pinpoint resource');
      await notificationsAPIRemoveApp(context);
      // Pinpoint App is not owned by Notifications
      printer.success('All notifications have been disabled');
      printer.warn(`${PinpointAppViewName} is provisioned through analytics`);
      printer.warn(`Next step: Run "amplify analytics remove" and select the ${PinpointAppViewName} to remove`);
    }
  }
  return context;
};
