const inquirer = require('inquirer');
const subcommand = 'add';
const category = 'api';
const apiGatewayService = 'API Gateway';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(async result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }

        if ((await shouldUpdateExistingRestApi(context, result.service)) === true) {
          return providerController.updateResource(context, category, result.service, { allowContainers: false });
        }

        return providerController.addResource(context, category, result.service, options);
      })
      .then(resourceName => {
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info(
          '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
        );
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the API resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};

async function shouldUpdateExistingRestApi(context, selectedService) {
  if (selectedService !== apiGatewayService) {
    return false;
  }

  const { allResources } = await context.amplify.getResourceStatus();
  const hasRestApis = allResources.some(resource => resource.service === apiGatewayService && resource.mobileHubMigrated !== true);

  if (!hasRestApis) {
    return false;
  }

  const question = [
    {
      name: 'update',
      message: 'Would you like to add a new path to an existing REST API:',
      type: 'confirm',
      default: true,
    },
  ];
  const answer = await inquirer.prompt(question);

  return answer.update;
}
