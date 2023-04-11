import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { run as generateComponents } from '../commands/generateComponents';

/**
 * The code to run after a push
 */
export const run = async (context: $TSContext): Promise<void> => {
  try {
    await generateComponents(context, 'PostPush');
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
};
