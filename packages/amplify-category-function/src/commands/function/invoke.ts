import { categoryName } from '../../provider-utils/awscloudformation/utils/constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'invoke';

module.exports = {
  name: subcommand,
  run: async context => {
    const servicesMetadata = supportedServices;
    const { amplify } = context;

    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata)
      .then(result => {
        const providerController = servicesMetadata[result.service].providerController;
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

        return providerController.invoke(context, categoryName, result.service, resourceName);
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('An error occurred when adding the function resource');
      });
  },
};
