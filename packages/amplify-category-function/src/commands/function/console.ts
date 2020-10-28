import { supportedServices as servicesMetadata } from '../../provider-utils/supported-services';
import { category } from '../../constants';

export const name = 'console';

export const run = async context => {
  const { amplify } = context;
  return amplify.serviceSelectionPrompt(context, category, servicesMetadata).then(result => {
    const providerController = servicesMetadata[result.service].providerController;
    if (!providerController) {
      context.print.error('Provider not configured for this category');
      return;
    }
    providerController.openConsole(context, result.service);
  });
};
