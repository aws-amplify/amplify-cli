/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSAny, $TSContext, AmplifyCategories } from 'amplify-cli-core';

const featureName = AmplifyCategories.NOTIFICATIONS;

/**
 * Displays Notifications walkthrough help for sub-commands ( routes to sub-commands on test/windows platform)
 * @param context amplify cli context
 * @returns Returns Notifications feature flow output in test/windows environment , and undefined otherwise
 */
export const run = async (context: $TSContext) : Promise<$TSAny|undefined> => {
  if (/^win/.test(process.platform)) {
    try {
      const notificationsFlow = require(`./${featureName}/${context.parameters.first}`);
      return notificationsFlow.run(context);
    } catch (e) {
      context.print.error('Command not found');
    }
  }
  const header = `amplify ${featureName} <subcommand>`;

  const commands = [
    {
      name: 'add',
      description: 'Adds a notification channel',
    },
    {
      name: 'remove',
      description: 'Removes a notification channel',
    },
    {
      name: 'update',
      description: 'Updates the configuration of a notification channel',
    },
    {
      name: 'status',
      description: 'Lists the enabled/disabled statuses of the available notification channels',
    },
    {
      name: 'console',
      description: 'Opens the Amazon Pinpoint console displaying the current channel settings',
    },
  ];

  context.amplify.showHelp(header, commands);

  context.print.info('');
  return undefined;
};

module.exports = {
  name: featureName,
  alias: ['notification'],
  run,
};
