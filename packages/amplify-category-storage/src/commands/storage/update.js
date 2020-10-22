const subcommand = 'update';
const category = 'storage';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;
    const serviceMetadata = require('../../provider-utils/supported-services').supportedServices;

    return amplify
      .serviceSelectionPrompt(context, category, serviceMetadata)
      .then(result => {
        const providerController = require(`../../provider-utils/${result.providerName}`);

        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.updateResource(context, category, result.service);
      })
      .then(() => context.print.success('Successfully updated resource'))
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('An error occurred when updating the storage resource');

        context.usageData.emitError(err);

        process.exitCode = 1;
      });
  },
};
