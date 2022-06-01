import inquirer from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import * as multiEnvManager from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../notifications-api-types';
import { NotificationsDB as Notifications } from '../../notifications-backend-cfg-api';
import { isPinpointAppDeployed } from '../../pinpoint-helper';

/**
 * Configuration walkthrough for Notifications resources
 * @param context amplify cli context
 * @returns context with notifications metadata updated
 */
export const run = async (context:$TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const availableChannels = Notifications.ChannelAPI.getAvailableChannels();
  let channelName = context.parameters.first;

  if (!channelName || !availableChannels.includes(channelName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose the push notification channel to configure.',
      choices: availableChannels,
      default: availableChannels[0],
    });
    channelName = answer.selection;
  }

  const pinpointAppStatus = await pinpointHelper.ensurePinpointApp(context, undefined);
  if (isPinpointAppDeployed(pinpointAppStatus.status)
  || Notifications.ChannelAPI.isChannelDeploymentDeferred(channelName)) {
    const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.configureChannel(context, channelName);
    await multiEnvManager.writeData(context, channelAPIResponse);
  }
  return context;
};

module.exports = {
  name: 'configure',
  alias: 'update',
  run,
};
