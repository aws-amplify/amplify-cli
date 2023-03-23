import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext, exitOnNextTick } from 'amplify-cli-core';
import { prePushHandler } from './prePushHandler';
/**
 * preInit handler for function category
 *
 * Checks if the `--forcePush` option is specified and if so, invokes the function prePush handler
 */
export const preInitHandler = async (context: $TSContext): Promise<void> => {
  if (context.parameters.options?.forcePush === true) {
    try {
      await prePushHandler(context);
    } catch (err) {
      printer.error(err);
      exitOnNextTick(1);
    }
  }
};
