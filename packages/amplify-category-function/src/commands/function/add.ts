import { categoryName } from '../../provider-utils/awscloudformation/utils/constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'add';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata)
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
      .then(resourceName => {
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally.`);
        print.info('');
        print.success('Next steps:');
        print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${resourceName}/src`);
        print.info('"amplify function build" builds all of your functions currently in the project');
        print.info('"amplify mock function <functionName>" runs your function locally');
        print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
        print.info(
          '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
        );
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
      });
  },
};
