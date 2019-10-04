const fs = require('fs');

const subcommand = 'update';
const category = 'storage';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;

    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(result => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
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
      });
  },
};
