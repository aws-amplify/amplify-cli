const subcommand = 'add';
const category = 'api';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.addResource(context, category, result.service, options);
      })
      .then(resourceName => {
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info(
          '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud'
        );
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the API resource');
      });
  },
};
