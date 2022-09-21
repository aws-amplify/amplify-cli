import { $TSContext } from 'amplify-cli-core';
import inquirer from 'inquirer';
import { writeData } from '../../multi-env-manager';
import { configureChannel, getAvailableChannels } from '../../notifications-manager';
import { ensurePinpointApp } from '../../pinpoint-helper';

export const name = 'configure';
export const alias = 'update';

/**
 * Configuration walkthrough for Notifications resources
 * @param context amplify cli context
 * @returns context with notifications metadata updated
 */
export const run = async (context : $TSContext): Promise<$TSContext> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const availableChannels = getAvailableChannels();
  let channelName = context.parameters.first;

  if (!channelName || !availableChannels.includes(channelName)) {
    const answer = await inquirer.prompt({
      name: 'selection',
      type: 'list',
      message: 'Choose the push notification channel to configure.',
      choices: availableChannels,
      default: availableChannels[0],
    });
    channelName = answer.selection;
  }

  await ensurePinpointApp(context, undefined);
  if (await configureChannel(context, channelName)) {
    await writeData(context);
  }

  return context;
};
