/* eslint-disable no-param-reassign */
import { prompt } from 'inquirer';
import { $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { ensurePinpointApp } from '../../pinpoint-helper';
import { enableChannel } from '../../notifications-manager';
import { writeData } from '../../multi-env-manager';
import { IChannelAPIResponse } from '../../notifications-api-types';
import { NotificationsMeta } from '../../notifications-meta-api';
import { NotificationsDB } from '../../notifications-backend-cfg-api';

export const name = 'add';
export const alias = 'enable';
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

  const availableChannels: Array<string> = NotificationsDB.getAvailableChannels();
  const disabledChannels : Array<string> = await NotificationsMeta.getDisabledChannelsFromAmplifyMeta();

  let channelName = context.parameters.first;
  if (disabledChannels.length > 0) {
    if (!channelName || !availableChannels.includes(channelName)) {
      const answer = await prompt({
        name: 'selection',
        type: 'list',
        message: 'Choose the push notification channel to enable.',
        choices: disabledChannels,
        default: disabledChannels[0],
      });
      channelName = answer.selection;
    } else if (!disabledChannels.includes(channelName)) {
      context.print.info(`The ${channelName} channel has already been enabled.`);
      channelName = undefined;
    }

    if (channelName) {
      // eslint-disable-next-line no-param-reassign
      context = await ensurePinpointApp(context, undefined);
      const channelAPIResponse : IChannelAPIResponse|undefined = await enableChannel(context, channelName);
      if (channelAPIResponse) {
        await NotificationsDB.updateChannelAPIResponse(context, channelAPIResponse);
      }
      console.log(`SACPCDEBUG:NOTIFICATIONS:Add:3: Calling Write Data: ${channelName} `,
        JSON.stringify(context.exeInfo.backendConfig[AmplifyCategories.NOTIFICATIONS], null, 2));
      await writeData(context, channelAPIResponse);
    }
  } else {
    context.print.info('All the available notification channels have already been enabled.');
  }

  return context;
};
