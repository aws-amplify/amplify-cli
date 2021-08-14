import { AmplifyCategories, CLISubCommands } from 'amplify-cli-core';

module.exports = {
  name: CLISubCommands.UPDATE,
  alias: ['configure'],
  run: async (context: any) => {
    const { amplify } = context;
    const serviceMetadata = require('../../provider-utils/supported-services').supportedServices;

    return amplify
      .serviceSelectionPrompt(context, AmplifyCategories.STORAGE, serviceMetadata)
      .then((result: any) => {
        const providerController = require(`../../provider-utils/${result.providerName}`);

        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.updateResource(context, AmplifyCategories.STORAGE, result.service);
      })
      .then((result: any) => {
        if (result) {
          context.print.success('Successfully updated resource');
        }
      })
      .catch((err: any) => {
        context.print.info(err.stack);
        context.print.error('An error occurred when updating the storage resource');

        context.usageData.emitError(err);

        process.exitCode = 1;
      });
  },
};
