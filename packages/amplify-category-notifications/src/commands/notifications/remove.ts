import inquirer from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import * as multiEnvManager from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../notifications-api-types';
import { NotificationsDB } from '../../notifications-backend-cfg-api';
import { NotificationsMeta } from '../../notifications-meta-api';

const DELETE_PINPOINT_APP = 'The Pinpoint application';
const CANCEL = 'Cancel';

/**
 * Remove walkthrough for notifications resource
 * @param context amplify cli context
 * @returns amplify cli context with updated notifications metadata
 */
export const run = async (context:$TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const pinpointAppConfig = await NotificationsDB.getNotificationsAppConfig();
  if (!pinpointAppConfig) {
    context.print.error('Notifications have not been added to your project.');
    return context;
  }

  if (await NotificationsMeta.checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    context.print.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }
  const availableChannels = NotificationsDB.getAvailableChannels();
  const enabledChannels = await NotificationsDB.getEnabledChannelsFromBackendConfig();

  enabledChannels.push(DELETE_PINPOINT_APP); // Delete the entire PinpointApp
  enabledChannels.push(CANCEL);

  let channelName = context.parameters.first;

  if (!channelName || !availableChannels.includes(channelName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose what to remove.',
      choices: enabledChannels,
      default: enabledChannels[0],
    });
    channelName = answer.selection;
  } else if (!enabledChannels.includes(channelName)) {
    context.print.info(`The ${channelName} channel has NOT been enabled.`);
    channelName = undefined;
  }

  if (channelName && channelName !== CANCEL) {
    if (channelName !== DELETE_PINPOINT_APP) {
      await pinpointHelper.ensurePinpointApp(context, undefined);
      const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.disableChannel(context, channelName);
      await multiEnvManager.writeData(context, channelAPIResponse);
    } else if (pinpointHelper.isAnalyticsAdded(context)) {
      context.print.error('Execution aborted.');
      context.print.info('You have an analytics resource in your backend tied to the Amazon Pinpoint resource');
      context.print.info('The Analytics resource must be removed before Amazon Pinpoint can be deleted from the cloud');
    } else {
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
    }
  }

  return context;
};

module.exports = {
  name: 'remove',
  alias: ['disable', 'delete'],
  run,
};
