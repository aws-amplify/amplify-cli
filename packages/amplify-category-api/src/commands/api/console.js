const subcommand = 'console';
const category = 'api';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(async result => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          throw new Error(`Provider "${result.providerName}" is not configured for this category`);
        }
        return await providerController.console(context, result.service);
      })
      .catch(err => {
        context.print.error('Error opening console.');
        context.print.info(err.message);
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
