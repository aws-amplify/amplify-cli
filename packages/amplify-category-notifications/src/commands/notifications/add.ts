/* eslint-disable no-param-reassign */
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { ensurePinpointApp, isPinpointAppDeployed } from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';

import { ChannelConfigDeploymentType } from '../../channel-types';
import { writeData } from '../../multi-env-manager-utils';
import { viewShowAllChannelsEnabledWarning, viewShowDeferredModeInstructions } from '../../display-utils';
import {
  getChannelViewName,
  getChannelNameFromView,
  getAvailableChannels,
  isValidChannel,
  isChannelDeploymentDeferred,
} from '../../notifications-backend-cfg-channel-api';
import { checkMigratedFromMobileHub, getDisabledChannelsFromAmplifyMeta } from '../../notifications-amplify-meta-api';
import { checkAndCreatePinpointApp } from '../../multi-env-manager';

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
  selectedChannel: string | undefined,
): Promise<string | undefined> => {
  let channelViewName = selectedChannel ? getChannelViewName(selectedChannel) : undefined;
  const availableChannelViewNames = availableChannels.map((channelName) => getChannelViewName(channelName));
  const disabledChannelViewNames = disabledChannels.map((channelName) => getChannelViewName(channelName));

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    channelViewName = await prompter.pick('Choose the notification channel to enable', disabledChannelViewNames);
  } else if (!disabledChannelViewNames.includes(channelViewName)) {
    printer.info(`The ${channelViewName} channel has already been enabled.`);
    channelViewName = undefined;
  }
  return channelViewName ? getChannelNameFromView(channelViewName) : undefined;
};

/**
 * Run function for amplify cli add
 * @param context amplify cli context
 * @returns updated context with notifications metadata
 */
export const run = async (context: $TSContext): Promise<$TSContext> => {
  if (await checkMigratedFromMobileHub(context.exeInfo.amplifyMeta)) {
    throw new AmplifyError('ConfigurationError', {
      message: 'Notifications has been migrated from Mobile Hub and channels cannot be added with Amplify CLI.',
    });
  }

  printer.warn(`Amazon Pinpoint is reaching end of life on October 30, 2026 and no longer accepts new customers as of May 20, 2025.
    It is recommended you use use AWS End User Messaging for push notifications and SMS, Amazon Simple Email Service for sending emails, Amazon Connect for campaigns, journeys, endpoints, and engagement analytics.
    For more information see: https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html \n`);

  const availableChannels: Array<string> = getAvailableChannels();
  const disabledChannels: Array<string> = await getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;

  if (disabledChannels.length <= 0) {
    viewShowAllChannelsEnabledWarning();
    return context;
  }

  channelName = await viewQuestionAskNotificationChannelToBeEnabled(availableChannels, disabledChannels, channelName);
  if (isValidChannel(channelName) && typeof channelName === 'string') {
    const pinpointAppStatus = await checkAndCreatePinpointApp(context, channelName, await ensurePinpointApp(context, undefined));

    // enable the channel
    if (isPinpointAppDeployed(pinpointAppStatus.status) || isChannelDeploymentDeferred(channelName)) {
      const channelAPIResponse = await enableChannel(context, channelName);
      await writeData(context, channelAPIResponse);
      if (channelAPIResponse?.deploymentType === ChannelConfigDeploymentType.DEFERRED) {
        viewShowDeferredModeInstructions();
      }
    }
  }

  return context;
};
