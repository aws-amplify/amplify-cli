import { $TSContext, AmplifyError } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import { IChannelAPIResponse } from '../../channel-types';
import { isPinpointAppDeployed } from '../../pinpoint-helper';
import { viewShowInlineModeInstructionsFail, viewShowInlineModeInstructionsStart, viewShowInlineModeInstructionsStop } from '../../display-utils';
import { writeData } from '../../multi-env-manager-utils';
import {
  getAvailableChannelViewNames, getChannelViewName, getChannelNameFromView, isChannelDeploymentDeferred,
} from '../../notifications-backend-cfg-channel-api';

export const name = 'configure';
export const alias = 'update';
/**
 * Configuration walkthrough for Notifications resources
 * @param context amplify cli context
 * @returns context with notifications metadata updated
 */
export const run = async (context:$TSContext): Promise<$TSContext> => {
  const availableChannelViewNames = getAvailableChannelViewNames();
  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? getChannelViewName(channelName) : undefined;

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    channelViewName = await prompter.pick('Choose the notification channel to configure', availableChannelViewNames);
  }
  if (channelViewName) {
    const selectedChannel = getChannelNameFromView(channelViewName);
    let pinpointAppStatus = await pinpointHelper.ensurePinpointApp(context, undefined);
    // In-line deployment now requires an amplify-push to create the Pinpoint resource
    if (pinpointHelper.isPinpointDeploymentRequired(channelName, pinpointAppStatus)) {
      await viewShowInlineModeInstructionsStart(channelName);
      try {
        // updates the pinpoint app status
        pinpointAppStatus = await pinpointHelper.pushAuthAndAnalyticsPinpointResources(context, pinpointAppStatus);
        await viewShowInlineModeInstructionsStop(channelName);
      } catch (err) {
        // if the push fails, the user will be prompted to deploy the resource manually
        await viewShowInlineModeInstructionsFail(channelName, err);
        throw new AmplifyError('DeploymentError', {
          message: 'Failed to deploy Auth and Pinpoint resources.',
          resolution: 'Deploy Auth and Pinpoint resources manually.',
        }, err);
      }
    }
    if (isPinpointAppDeployed(pinpointAppStatus.status) || isChannelDeploymentDeferred(selectedChannel)) {
      const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.configureChannel(context, selectedChannel);
      await writeData(context, channelAPIResponse);
    }
  } else {
    throw new AmplifyError('ConfigurationError', {
      message: `Update failure: Invalid Channel selected ${channelViewName}`,
      resolution: `Select an available channel from the list: ${availableChannelViewNames.join(', ')}`,
    });
  }
  return context;
};
