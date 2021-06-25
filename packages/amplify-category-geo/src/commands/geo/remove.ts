import { chooseServiceMessageRemove } from '../../provider-utils/awscloudformation/utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../provider-utils/supportedServices';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async (context: any) => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata, chooseServiceMessageRemove)
      .then((result: {service: string, providerName: string}) => {
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.removeResource(context, result.service);
      })
      .then(() => {
        context.print.info('');
      })
      .catch((err: any) => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the geo resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  }
};
