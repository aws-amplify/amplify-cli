const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');
const path = require('path');

const subcommand = 'enable';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  alias: ['add'],
  run: async (context) => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);

    const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

    if (Object.keys(existingAuth).length > 0) {
      return context.print.warning(messages.authExists);
    }

    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.addResource(context, category, result.service);
      })
      .then((resourceName) => {
        const resourceDirPath = path.join(
          amplify.pathManager.getBackendDirPath(),
          '/auth/',
          resourceName,
          'parameters.json',
        );
        const authParameters = amplify.readJsonFile(resourceDirPath);

        if (authParameters.dependsOn) {
          options.dependsOn = authParameters.dependsOn;
        }
        amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        print.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        print.info('');
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the auth resource');
      });
  },
};
