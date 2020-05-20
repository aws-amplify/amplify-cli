import { chooseServiceMessage, ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { category as categoryName } from '../../constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'add';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata, chooseServiceMessage)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          build: true,
        };
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.addResource(context, categoryName, result.service, options);
      })
      .then(result => {
        const { print } = context;
        for (let textObj of result) {
          print[textObj.type || 'info'](textObj.text);
        }
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
      });
  },
};
