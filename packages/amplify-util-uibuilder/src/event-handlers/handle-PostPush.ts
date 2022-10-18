import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { run as generateComponents } from '../commands/generateComponents';

/**
 * The code to run after a push
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    await generateComponents(context);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
};
