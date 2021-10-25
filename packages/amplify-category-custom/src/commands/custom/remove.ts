import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

module.exports = {
  name: 'remove',
  run: async (context: $TSContext) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, 'custom', resourceName).catch((err: any) => {
      printer.error(err.stack);
      printer.error('An error occurred when removing the custom resource');

      context.usageData.emitError(err);

      process.exitCode = 1;
    });
  },
};
