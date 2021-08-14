
import { AmplifyCategories, CLISubCommands } from 'amplify-cli-core';

module.exports = {
  name: CLISubCommands.REMOVE,
  run: async (context: any) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, AmplifyCategories.STORAGE, resourceName).catch((err: any) => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the storage resource');

      context.usageData.emitError(err);

      process.exitCode = 1;
    });
  },
};
