import inquirer from 'inquirer';
import { $TSContext } from 'amplify-cli-core';
import * as pinpointHelper from '../../pinpoint-helper';
import * as notificationManager from '../../notifications-manager';
import * as multiEnvManager from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../channel-types';
import { Notifications } from '../../notifications-api';
import { isPinpointAppDeployed } from '../../pinpoint-helper';
import { viewShowInlineModeInstructionsFail, viewShowInlineModeInstructionsStart, viewShowInlineModeInstructionsStop } from './add';

/**
 * Configuration walkthrough for Notifications resources
 * @param context amplify cli context
 * @returns context with notifications metadata updated
 */
export const run = async (context:$TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const availableChannelViewNames = Notifications.ChannelCfg.getAvailableChannelViewNames();
  const channelName = context.parameters.first;
  let channelViewName = (channelName) ? Notifications.ChannelCfg.getChannelViewName(channelName) : undefined;

  if (!channelViewName || !availableChannelViewNames.includes(channelViewName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose the notification channel to configure.',
      choices: availableChannelViewNames,
      default: availableChannelViewNames[0],
    });
    channelViewName = answer.selection;
  }
  if (channelViewName) {
    const selectedChannel = Notifications.ChannelCfg.getChannelNameFromView(channelViewName);
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
        throw new Error('Failed to deploy Auth and Pinpoint resources. Please deploy them manually.');
      }
      // eslint-disable-next-line no-param-reassign
      context = pinpointAppStatus.context;
    }
    if (isPinpointAppDeployed(pinpointAppStatus.status)
    || Notifications.ChannelCfg.isChannelDeploymentDeferred(selectedChannel)) {
      const channelAPIResponse : IChannelAPIResponse|undefined = await notificationManager.configureChannel(context, selectedChannel);
      await multiEnvManager.writeData(context, channelAPIResponse);
    }
  } else {
    throw new Error(`Update failure: Invalid Channel selected ${channelViewName}`);
  }
  return context;
};

module.exports = {
  name: 'configure',
  alias: 'update',
  run,
};
