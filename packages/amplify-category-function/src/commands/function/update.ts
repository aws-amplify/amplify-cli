import { categoryName ,chooseServiceMessage,chooseServiceChoices,ServiceNames} from '../../provider-utils/awscloudformation/utils/constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'update';

let options;

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata,chooseServiceMessage, chooseServiceChoices)
      .then(result => {
        const providerController = servicesMetadata[result.service].providerController;
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, categoryName, result.service);
      })
      .then(result => {
        const { print } = context;
        const { name, service } = result;
        if (service === ServiceNames.LambdaFunction) {
          print.success(`Successfully added resource ${name} locally.`);
        } else if (service === ServiceNames.LambdaLayer) {
          print.success(`Successfully added resource ${name} locally.`);
        }
      })
      .catch(err => {
        context.print.error(err.stack);
      });
  },
};
