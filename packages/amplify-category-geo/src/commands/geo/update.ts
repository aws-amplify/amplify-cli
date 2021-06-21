import { chooseServiceMessageUpdate } from '../../provider-utils/awscloudformation/utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../provider-utils/supportedServices';

const subcommand = 'update';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async (context: any) => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata, chooseServiceMessageUpdate)
      .then((result: {service: string}) => {
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, result.service);
      })
      .then(() => {
        context.print.info('');
      })
      .catch((err: any) => {
        context.print.info(err.stack);
        context.print.error('There was an error updating the geo resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
