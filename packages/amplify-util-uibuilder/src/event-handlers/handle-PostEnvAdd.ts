import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export async function run(context: $TSContext) {
  try {
    await context.amplify.invokePluginMethod(context, 'ui-builder', undefined, 'executeAmplifyCommand', [
      context,
      'cloneComponentsFromEnv',
    ]);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
}
