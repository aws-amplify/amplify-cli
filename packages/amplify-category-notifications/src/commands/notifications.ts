import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { run as runHelp } from './notifications/help';

export const name = 'notifications';
export const alias = ['notification'];

/**
 * Displays Notifications walkthrough help for sub-commands ( routes to sub-commands on test/windows platform)
 * @param context amplify cli context
 * @returns Returns Notifications feature flow output in test/windows environment , and undefined otherwise
 */
export const run = async (context: $TSContext): Promise<$TSAny | undefined> => {
  if (context.parameters.options?.help) {
    return runHelp(context);
  }
  if (/^win/.test(process.platform)) {
    try {
      const notificationsFlow = await import(`./${name}/${context.parameters.first}`);
      return notificationsFlow.run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }
  return undefined;
};
