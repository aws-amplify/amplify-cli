/* eslint-disable no-param-reassign */
import { prompt } from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import {
  ensurePinpointApp, isPinpointAppDeployed,
} from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';
import { writeData } from '../../multi-env-manager';
import { ChannelConfigDeploymentType, IChannelAPIResponse } from '../../notifications-api-types';
import { NotificationsMeta } from '../../notifications-meta-api';
import { NotificationsDB as Notifications } from '../../notifications-backend-cfg-api';

export const name = 'add';
export const alias = 'enable';

const viewQuestionAskNotificationChannelToBeEnabled = async (context:$TSContext, availableChannels: Array<string>,
  disabledChannels:Array<string>, selectedChannel: string|undefined):Promise<string|undefined> => {
  let channelName = selectedChannel;
  if (!channelName || !availableChannels.includes(channelName)) {
    const answer = await prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose the notification channel to enable.',
      choices: disabledChannels,
      default: disabledChannels[0],
    });
    channelName = answer.selection;
  } else if (!disabledChannels.includes(channelName)) {
    context.print.info(`The ${channelName} channel has already been enabled.`);
    channelName = undefined;
  }
  return channelName;
};

const viewShowAllChannelsEnabledWarning = async (context: $TSContext) :Promise<void> => {
  context.print.info('All the available notification channels have already been enabled.');
};
const viewShowDeferredModeInstructions = async (context: $TSContext): Promise<void> => {
  context.print.warning('Run "amplify push" to update the channel in the cloud');
};

/**
 * Run function for amplify cli add
 * @param context amplify cli context
 * @returns updated context with notifications metadata
 */
export const run = async (context: $TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();

  if (await NotificationsMeta.checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    context.print.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }

  const availableChannels: Array<string> = Notifications.ChannelAPI.getAvailableChannels();
  const disabledChannels : Array<string> = await NotificationsMeta.getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;

  if (disabledChannels.length <= 0) {
    await viewShowAllChannelsEnabledWarning(context);
    return context;
  }
  channelName = await viewQuestionAskNotificationChannelToBeEnabled(context, availableChannels, disabledChannels, channelName);
  if (Notifications.ChannelAPI.isValidChannel(channelName)) {
    const pinpointAppStatus = await ensurePinpointApp(context, undefined);
    context = pinpointAppStatus.context;
    if (isPinpointAppDeployed(pinpointAppStatus.status) || Notifications.ChannelAPI.isChannelDeploymentDeferred(channelName)) {
      try {
        const channelAPIResponse : IChannelAPIResponse|undefined = await enableChannel(context, channelName);
        await writeData(context, channelAPIResponse);
        if (channelAPIResponse?.deploymentType === ChannelConfigDeploymentType.DEFERRED) {
          await viewShowDeferredModeInstructions(context);
        }
      } catch (e) {
        console.log('Enable Channel Failed!! ', e);
      }
    }
  }

  return context;
};
