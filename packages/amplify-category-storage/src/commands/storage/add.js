const subcommand = 'add';
const category = 'storage';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const serviceMetadata = require('../../provider-utils/supported-services').supportedServices;
    return amplify
      .serviceSelectionPrompt(context, category, serviceMetadata)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };

        const providerController = require(`../../provider-utils/${result.providerName}`);

        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        return providerController.addResource(context, category, result.service, options);
      })
      .then(resourceName => {
        if (resourceName) {
          const { print } = context;

          print.success(`Successfully added resource ${resourceName} locally`);
          print.info('');
          print.warning(
            'If a user is part of a user pool group, run "amplify update storage" to enable IAM group policies for CRUD operations',
          );
          print.success('Some next steps:');
          print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
          print.info(
            '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
          );
          print.info('');
        }
      })
      .catch(err => {
        if (err.message) {
          context.print.error(err.message);
        }

        context.print.error('An error occurred when adding the storage resource');

        if (err.stack) {
          context.print.info(err.stack);
        }

        context.usageData.emitError(err);

        process.exitCode = 1;
      });
  },
};
