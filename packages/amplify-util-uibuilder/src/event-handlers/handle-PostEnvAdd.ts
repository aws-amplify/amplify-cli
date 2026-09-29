import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { run as cloneComponentsFromEnv } from '../commands/cloneComponentsFromEnv';

/**
 *
 * runs after adding an environment
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    await cloneComponentsFromEnv(context);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
};
