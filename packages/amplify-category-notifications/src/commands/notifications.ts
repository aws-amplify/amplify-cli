import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export const name = 'notifications';
export const alias = ['notification'];

/**
 * Displays Notifications walkthrough help for sub-commands ( routes to sub-commands on test/windows platform)
 * @param context amplify cli context
 * @returns Returns Notifications feature flow output in test/windows environment , and undefined otherwise
 */
export const run = async (context: $TSContext) : Promise<$TSAny|undefined> => {
  if (/^win/.test(process.platform)) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const notificationsFlow = require(`./${name}/${context.parameters.first}`);
      return notificationsFlow.run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }

  const header = `amplify ${name} <subcommand>`;
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
  printer.blankLine();

  return undefined;
};
