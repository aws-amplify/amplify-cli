import { supportedServices } from '../../provider-utils/supported-services';
import { chooseServiceMessageUpdate } from '../../provider-utils/awscloudformation/utils/constants';
import { category as categoryName } from '../../constants';

const subcommand = 'update';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata, chooseServiceMessageUpdate)
      .then(result => {
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, categoryName, result.service);
      })
      .then(() => {
        context.print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
        context.usageData.emitError(err);
      });
  },
};
