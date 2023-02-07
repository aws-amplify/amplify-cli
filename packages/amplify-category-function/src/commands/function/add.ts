import { chooseServiceMessageAdd } from '../../provider-utils/awscloudformation/utils/constants';
import { categoryName } from '../../constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'add';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata, chooseServiceMessageAdd)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          build: true,
        };
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return undefined;
        }
        return providerController.addResource(context, categoryName, result.service, options);
      })
      .then(() => {
        context.print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
