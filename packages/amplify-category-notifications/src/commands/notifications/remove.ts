import {
  $TSContext, AmplifyCategories, amplifyErrorWithTroubleshootingLink, stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
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
  const envName = stateManager.getCurrentEnvName();
  const notificationsMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  const notificationConfig = await getNotificationsAppConfig(context.exeInfo.backendConfig);
  if (!notificationConfig) {
    throw amplifyErrorWithTroubleshootingLink('ConfigurationError', {
      message: 'Notifications have not been added to your project.',
    });
  }

  if (await checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    throw amplifyErrorWithTroubleshootingLink('ConfigurationError', {
      message: 'Notifications has been migrated from Mobile Hub and channels cannot be added with Amplify CLI.',
    });
  }

  const availableChannelViewNames = getAvailableChannelViewNames();
  const enabledChannelViewNames = await getEnabledChannelViewNames(notificationConfig);
  const PinpointAppViewName = `All channels on Pinpoint resource : ${chalk.cyan.bold(notificationConfig.serviceName)}`;
  const optionChannelViewNames = [...enabledChannelViewNames, PinpointAppViewName, CANCEL];

  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? getChannelViewName(channelName) : undefined;

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    channelViewName = await prompter.pick('Choose the notification channel to remove', optionChannelViewNames);
  } else if (!optionChannelViewNames.includes(channelViewName)) {
    printer.info(`The ${channelViewName} channel has NOT been enabled.`);
    channelViewName = undefined;
  }

  if (channelViewName && channelViewName !== CANCEL) {
    const pinpointAppStatus = await getPinpointAppStatus(
      context,
      context.exeInfo.amplifyMeta,
      notificationsMeta,
      envName,
    );
    if (channelViewName !== PinpointAppViewName) {
      const selectedChannelName = getChannelNameFromView(channelViewName);
      // a channel can only be disabled if the PinpointApp exists
      await ensurePinpointApp(context, undefined, pinpointAppStatus, envName);
      if (isPinpointAppDeployed(pinpointAppStatus.status) || isChannelDeploymentDeferred(selectedChannelName)) {
        const channelAPIResponse : IChannelAPIResponse|undefined = await disableChannel(context, selectedChannelName);
        await writeData(context, channelAPIResponse);
      }
    } else if (isPinpointAppOwnedByNotifications(pinpointAppStatus.status)) {
      const confirmDelete = await prompter.confirmContinue('Confirm that you want to delete the associated Amazon Pinpoint application');
      if (confirmDelete) {
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
