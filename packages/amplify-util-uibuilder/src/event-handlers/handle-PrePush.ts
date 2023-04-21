import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { prePushHandler } from '../utils/prePushHandler';

/**
 * The code to run before a push.
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    await prePushHandler(context);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug((e as Error).message);
  }
};
