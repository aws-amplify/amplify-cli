import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { prePushHandler } from '../utils/prePushHandler';

/**
 * The code to run before a push.
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    await prePushHandler(context);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
};
