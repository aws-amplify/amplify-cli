/* eslint-disable no-param-reassign */
import { prompt } from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import {
  ensurePinpointApp, isPinpointAppDeployed, isPinpointDeploymentRequired, pushAuthAndAnalyticsPinpointResources,
} from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';

import { ChannelConfigDeploymentType, IChannelAPIResponse } from '../../channel-types';
import { NotificationsMeta } from '../../notifications-amplify-meta-api';
import { Notifications } from '../../notifications-api';
import { writeData } from '../../multi-env-manager-utils';
import {
  viewShowAllChannelsEnabledWarning,
  viewShowDeferredModeInstructions,
  viewShowInlineModeInstructionsFail,
  viewShowInlineModeInstructionsStart,
  viewShowInlineModeInstructionsStop,
} from '../../display-utils';

export const name = 'add';
export const alias = 'enable';

/**
 * Display question to select notification channel to be enabled
 * @param availableChannels all channels supported in Amplify notifications
 * @param disabledChannels channels which have been already programmed
 * @param selectedChannel previously selected channel
 * @returns user selected channel name
 */
const viewQuestionAskNotificationChannelToBeEnabled = async (
  availableChannels: Array<string>,
  disabledChannels: Array<string>,
  selectedChannel: string|undefined,
): Promise<string|undefined> => {
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
    printer.info(`The ${channelViewName} channel has already been enabled.`);
    channelViewName = undefined;
  }
  return (channelViewName) ? Notifications.ChannelCfg.getChannelNameFromView(channelViewName) : undefined;
};

/**
 * Run function for amplify cli add
 * @param context amplify cli context
 * @returns updated context with notifications metadata
 */
export const run = async (context: $TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();

  if (await NotificationsMeta.checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    printer.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
    return context;
  }

  const availableChannels: Array<string> = Notifications.ChannelCfg.getAvailableChannels();
  const disabledChannels : Array<string> = await NotificationsMeta.getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;

  if (disabledChannels.length <= 0) {
    viewShowAllChannelsEnabledWarning();
    return context;
  }

  channelName = await viewQuestionAskNotificationChannelToBeEnabled(availableChannels, disabledChannels, channelName);
  if (Notifications.ChannelCfg.isValidChannel(channelName)) {
    let pinpointAppStatus = await ensurePinpointApp(context, undefined);
    context = pinpointAppStatus.context;
    // In-line deployment now requires an amplify-push to create the Pinpoint resource
    if (isPinpointDeploymentRequired(channelName, pinpointAppStatus)) {
      await viewShowInlineModeInstructionsStart(channelName);
      try {
        // updates the pinpoint app status
        pinpointAppStatus = await pushAuthAndAnalyticsPinpointResources(context, pinpointAppStatus);
        pinpointAppStatus = await ensurePinpointApp(context, pinpointAppStatus);
        await viewShowInlineModeInstructionsStop(channelName);
      } catch (err) {
        // if the push fails, the user will be prompted to deploy the resource manually
        await viewShowInlineModeInstructionsFail(channelName, err);
        throw new Error('Failed to deploy Auth and Pinpoint resources. Please deploy them manually.');
      }
      context = pinpointAppStatus.context;
    }
    // enable the channel
    if (isPinpointAppDeployed(pinpointAppStatus.status) || Notifications.ChannelCfg.isChannelDeploymentDeferred(channelName)) {
      const channelAPIResponse : IChannelAPIResponse|undefined = await enableChannel(context, channelName);
      await writeData(context, channelAPIResponse);
      if (channelAPIResponse?.deploymentType === ChannelConfigDeploymentType.DEFERRED) {
        viewShowDeferredModeInstructions();
      }
    }
  }

  return context;
};
