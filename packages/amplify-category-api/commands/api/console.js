const fs = require('fs');

const subcommand = 'console';
const category = 'api';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;
    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        const providerController =
          require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.console(context, result.service);
      })
      .catch((err) => {
        context.print.error('Error opening console.');
        context.print.info(err.message);
      });
  },
};
