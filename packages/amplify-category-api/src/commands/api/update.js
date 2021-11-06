const { printer } = require('amplify-prompts');

const subcommand = 'update';
const category = 'api';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;

    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(result => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          printer.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, category, result.service);
      })
      .then(() => printer.success('Successfully updated resource'))
      .catch(err => {
        printer.error(err.message || err);
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
