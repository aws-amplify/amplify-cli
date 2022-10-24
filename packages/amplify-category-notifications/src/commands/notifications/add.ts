/* eslint-disable no-param-reassign */
import { $TSContext, AmplifyError, amplifyErrorWithTroubleshootingLink } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import {
  ensurePinpointApp, isPinpointAppDeployed, isPinpointDeploymentRequired, pushAuthAndAnalyticsPinpointResources,
} from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';

import { ChannelConfigDeploymentType, IChannelAPIResponse } from '../../channel-types';
import { writeData } from '../../multi-env-manager-utils';
import {
  viewShowAllChannelsEnabledWarning,
  viewShowDeferredModeInstructions,
  viewShowInlineModeInstructionsFail,
  viewShowInlineModeInstructionsStart,
  viewShowInlineModeInstructionsStop,
} from '../../display-utils';
import {
  getChannelViewName, getChannelNameFromView, getAvailableChannels, isValidChannel, isChannelDeploymentDeferred,
} from '../../notifications-backend-cfg-channel-api';
import { checkMigratedFromMobileHub, getDisabledChannelsFromAmplifyMeta } from '../../notifications-amplify-meta-api';

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
  let channelViewName = (selectedChannel) ? getChannelViewName(selectedChannel) : undefined;
  const availableChannelViewNames = availableChannels.map(channelName => getChannelViewName(channelName));
  const disabledChannelViewNames = disabledChannels.map(channelName => getChannelViewName(channelName));

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    channelViewName = await prompter.pick('Choose the notification channel to enable', disabledChannelViewNames);
  } else if (!disabledChannelViewNames.includes(channelViewName)) {
    printer.info(`The ${channelViewName} channel has already been enabled.`);
    channelViewName = undefined;
  }
  return (channelViewName) ? getChannelNameFromView(channelViewName) : undefined;
};

/**
 * Run function for amplify cli add
 * @param context amplify cli context
 * @returns updated context with notifications metadata
 */
export const run = async (context: $TSContext): Promise<$TSContext> => {
  if (await checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    throw amplifyErrorWithTroubleshootingLink('ConfigurationError', {
      message: 'Notifications has been migrated from Mobile Hub and channels cannot be added with Amplify CLI.',
    });
  }

  const availableChannels: Array<string> = getAvailableChannels();
  const disabledChannels: Array<string> = await getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;

  if (disabledChannels.length <= 0) {
    viewShowAllChannelsEnabledWarning();
    return context;
  }

  channelName = await viewQuestionAskNotificationChannelToBeEnabled(availableChannels, disabledChannels, channelName);
  if (isValidChannel(channelName)) {
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
        throw new AmplifyError('DeploymentError', {
          message: 'Failed to deploy Auth and Pinpoint resources.',
          resolution: 'Deploy the Auth and Pinpoint resources manually.',
          details: err.message,
          stack: err.stack,
        });
      }
      context = pinpointAppStatus.context;
    }
    // enable the channel
    if (isPinpointAppDeployed(pinpointAppStatus.status) || isChannelDeploymentDeferred(channelName)) {
      const channelAPIResponse : IChannelAPIResponse|undefined = await enableChannel(context, channelName);
      await writeData(context, channelAPIResponse);
      if (channelAPIResponse?.deploymentType === ChannelConfigDeploymentType.DEFERRED) {
        viewShowDeferredModeInstructions();
      }
    }
  }

  return context;
};
