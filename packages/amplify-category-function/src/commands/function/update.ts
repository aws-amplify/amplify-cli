import { supportedServices } from '../../provider-utils/supported-services';
import { chooseServiceMessageUpdate } from '../../provider-utils/awscloudformation/utils/constants';
import { categoryName } from '../../constants';
import { determineServiceSelection } from '../../provider-utils/awscloudformation/utils/determineServiceSelection';

const subcommand = 'update';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const servicesMetadata = supportedServices;
    return determineServiceSelection(context, chooseServiceMessageUpdate)
      .then(result => {
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return undefined;
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
        process.exitCode = 1;
      });
  },
};
