import inquirer from 'inquirer';
import { $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { enableChannel, getAvailableChannels, getDisabledChannels } from '../../notifications-manager';
import { ensurePinpointApp } from '../../pinpoint-helper';
import { writeData } from '../../multi-env-manager';

export const name = 'add';
export const alias = 'enable';

/**
 * Run function for amplify cli add
 * @param context amplify cli context
 * @returns updated context with notifications metadata
 */
export const run = async (context: $TSContext): Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();

  const categoryMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS];
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];

      if (serviceMeta.mobileHubMigrated === true) {
        printer.error('Notifications is migrated from Mobile Hub and channels cannot be added with Amplify CLI.');
      }
    }
  }

  const availableChannels = getAvailableChannels();
  const disabledChannels = getDisabledChannels(context);

  let channelName = context.parameters.first;
  if (disabledChannels.length > 0) {
    if (!channelName || !availableChannels.includes(channelName)) {
      const answer = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Choose the push notification channel to enable.',
        choices: disabledChannels,
        default: disabledChannels[0],
      });
      channelName = answer.selection;
    } else if (!disabledChannels.includes(channelName)) {
      printer.info(`The ${channelName} channel has already been enabled.`);
      channelName = undefined;
    }

    if (channelName) {
      await ensurePinpointApp(context, undefined);
      await enableChannel(context, channelName);
      await writeData(context);
    }
  } else {
    printer.info('All the available notification channels have already been enabled.');
  }
};
