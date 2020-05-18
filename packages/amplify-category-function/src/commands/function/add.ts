import {
  categoryName,
  chooseServiceMessage,
  chooseServiceChoices,
  ServiceNames,
} from '../../provider-utils/awscloudformation/utils/constants';
import { supportedServices } from '../../provider-utils/supported-services';

const subcommand = 'add';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata, chooseServiceMessage, chooseServiceChoices)
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
        const { name, service, layerDirPath } = result;
        if (service === ServiceNames.LambdaFunction) {
          print.success(`Successfully added resource ${name} locally.`);
        } else if (service === ServiceNames.LambdaLayer) {
          print.info('Lambda layer folders & files created:');
          print.info(layerDirPath);
        }

        print.info('');
        print.success('Next steps:');

        if (service === ServiceNames.LambdaFunction) {
          print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${name}/src`);
          print.info('"amplify function build" builds all of your functions currently in the project');
          print.info('"amplify mock function <functionName>" runs your function locally');
        } else if (service === ServiceNames.LambdaLayer) {
          print.info('Move your libraries in the following folder:');
          print.info('Include any files you want to share across runtimes in this folder:');
          print.info(`amplify/backend/function/${name}/opt/data`);
          print.info('"amplify function update <function-name>" - configure a function with this Lambda layer');
        }

        print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');

        if (service === ServiceNames.LambdaFunction) {
          print.info(
            '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
          );
        }

        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
      });
  },
};
