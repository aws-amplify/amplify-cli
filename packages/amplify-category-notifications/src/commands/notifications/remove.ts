import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

import inquirer from 'inquirer';
import { writeData } from '../../multi-env-manager';
import { disableChannel, getAvailableChannels, getEnabledChannels } from '../../notifications-manager';
import {
  deletePinpointApp, ensurePinpointApp, getPinpointApp, isAnalyticsAdded,
} from '../../pinpoint-helper';

const PinpointApp = 'The Pinpoint application';
const Cancel = 'Cancel';

export const name = 'remove';
export const alias = ['disable', 'delete'];

/**
 * Remove walkthrough for notifications resource
 * @param context amplify cli context
 * @returns amplify cli context with updated notifications metadata
 */
export const run = async (context : $TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const pinpointApp = getPinpointApp(context);
  if (pinpointApp) {
    const pinpointResource = context.exeInfo.amplifyMeta.notifications[pinpointApp.Name];

    if (pinpointResource && pinpointResource.mobileHubMigrated === true) {
      printer.error('Notifications is migrated from Mobile Hub and cannot be removed with Amplify CLI.');
      return context;
    }

    const availableChannels = getAvailableChannels();
    const enabledChannels = getEnabledChannels(context);

    enabledChannels.push(PinpointApp);
    enabledChannels.push(Cancel);

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
      printer.info(`The ${channelName} channel has NOT been enabled.`);
      channelName = undefined;
    }

    if (channelName && channelName !== Cancel) {
      if (channelName !== PinpointApp) {
        await ensurePinpointApp(context, undefined);
        await disableChannel(context, channelName);
        await writeData(context);
      } else if (isAnalyticsAdded(context)) {
        printer.error('Execution aborted.');
        printer.info('You have an analytics resource in your backend tied to the Amazon Pinpoint resource');
        printer.info('The Analytics resource must be removed before Amazon Pinpoint can be deleted from the cloud');
      } else {
        const answer = await inquirer.prompt({
          name: 'deletePinpointApp',
          type: 'confirm',
          message: 'Confirm that you want to delete the associated Amazon Pinpoint application',
          default: false,
        });
        if (answer.deletePinpointApp) {
          await deletePinpointApp(context);
          printer.info('The Pinpoint application has been successfully deleted.');
          await writeData(context);
        }
      }
    }
  } else {
    printer.error('Notifications have not been added to your project.');
  }

  return context;
};
