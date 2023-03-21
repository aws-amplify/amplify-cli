import { $TSContext } from 'amplify-cli-core';
import { prePushHandler } from './prePushHandler';
/**
 * preInit handler for function category
 *
 * Checks if the `--forcePush` option is specified and if so, invokes the function prePush handler
 */
export const preInitHandler = async (context: $TSContext): Promise<void> => {
  if (context.parameters.options?.forcePush === true) {
    await prePushHandler(context);
  }
};
