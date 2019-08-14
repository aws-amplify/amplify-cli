const subcommand = 'invoke';
const category = 'function';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const servicesMetadata = context.amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
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
          context.print.error('Provide a function resource name');
          return;
        }

        return providerController.invoke(context, category, result.service, resourceName);
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('An error occurred when adding the function resource');
      });
  },
};
