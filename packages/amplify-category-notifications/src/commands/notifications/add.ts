/* eslint-disable no-param-reassign */
import { prompt } from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import {
  ensurePinpointApp, isPinpointAppDeployed,
} from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';
import { writeData } from '../../multi-env-manager';
import { ChannelConfigDeploymentType, IChannelAPIResponse } from '../../channel-types';
import { NotificationsMeta } from '../../notifications-amplify-meta-api';
import { Notifications } from '../../notifications-api';

export const name = 'add';
export const alias = 'enable';

/**
 * Display question to select notification channel to be enabled
 * @param context amplify cli context
 * @param availableChannels all channels supported in Amplify notifications
 * @param disabledChannels channels which have been already programmed
 * @param selectedChannel previously selected channel
 * @returns user selected channel name
 */
const viewQuestionAskNotificationChannelToBeEnabled = async (context:$TSContext, availableChannels: Array<string>,
  disabledChannels:Array<string>, selectedChannel: string|undefined):Promise<string|undefined> => {
  let channelViewName = (selectedChannel) ? Notifications.ChannelCfg.getChannelViewName(selectedChannel) : undefined;
  const availableChannelViewNames = availableChannels.map(channelName => Notifications.ChannelCfg.getChannelViewName(channelName));
  const disabledChannelViewNames = disabledChannels.map(channelName => Notifications.ChannelCfg.getChannelViewName(channelName));

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    const answer = await prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose the notification channel to enable.',
      choices: disabledChannelViewNames,
      default: disabledChannelViewNames[0],
    });
    channelViewName = answer.selection;
  } else if (!disabledChannelViewNames.includes(channelViewName)) {
    context.print.info(`The ${channelViewName} channel has already been enabled.`);
    channelViewName = undefined;
  }
  const channelName = (channelViewName) ? Notifications.ChannelCfg.getChannelNameFromView(channelViewName) : undefined;
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

  const availableChannels: Array<string> = Notifications.ChannelCfg.getAvailableChannels();
  const disabledChannels : Array<string> = await NotificationsMeta.getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;

  if (disabledChannels.length <= 0) {
    await viewShowAllChannelsEnabledWarning(context);
    return context;
  }
  channelName = await viewQuestionAskNotificationChannelToBeEnabled(context, availableChannels, disabledChannels, channelName);
  if (Notifications.ChannelCfg.isValidChannel(channelName)) {
    const pinpointAppStatus = await ensurePinpointApp(context, undefined);
    context = pinpointAppStatus.context;
    if (isPinpointAppDeployed(pinpointAppStatus.status) || Notifications.ChannelCfg.isChannelDeploymentDeferred(channelName)) {
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
