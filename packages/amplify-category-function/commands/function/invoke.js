const fs = require('fs');

const subcommand = 'invoke';
const category = 'function';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;

    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not confgiured for this category');
          return;
        }
        if (!providerController.invoke) {
          context.print.error('Provider not confgiured for invoke command');
          return;
        }
        const resourceName = context.parameters.first;

        if (!resourceName) {
          context.print.error('Please provide a function resource name');
          return;
        }

        return providerController.invoke(context, category, resourceName);
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
      });
  },
};
