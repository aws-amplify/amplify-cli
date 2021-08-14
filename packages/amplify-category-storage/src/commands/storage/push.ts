
import { AmplifyCategories, CLISubCommands } from 'amplify-cli-core';

module.exports = {
  name: CLISubCommands.PUSH,
  run: async (context: any) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    context.amplify.constructExeInfo(context);

    return amplify.pushResources(context, AmplifyCategories.STORAGE, resourceName).catch((err: any) => {
      context.print.info(err.stack);
      context.print.error('An error occurred when pushing the storage resource');

      context.usageData.emitError(err);

      process.exitCode = 1;
    });
  },
};
