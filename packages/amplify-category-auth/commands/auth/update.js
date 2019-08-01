const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');
const path = require('path');

const subcommand = 'update';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  alias: ['update'],
  run: async (context) => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

    if (!Object.keys(existingAuth).length > 0) {
      return context.print.warning('Auth has not yet been added to this project.');
    }

    context.print.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');

    const meta = amplify.getProjectDetails().amplifyMeta;
    const dependentResources = Object.keys(meta)
      .some((e) => { //eslint-disable-line
        return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
      });

    if (dependentResources) {
      context.print.info(messages.dependenciesExists);
    }

    const resourceName = Object.keys(amplify.getProjectDetails().amplifyMeta.auth)[0];
    const providerPlugin = context.amplify
      .getPluginInstance(context, servicesMetadata.Cognito.provider);
    context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);

    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          resourceName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, category, options);
      })
      .then((resourceName) => { // eslint-disable-line no-shadow
        const resourceDirPath = path.join(
          amplify.pathManager.getBackendDirPath(),
          '/auth/',
          resourceName,
          'parameters.json',
        );
        const authParameters = amplify.readJsonFile(resourceDirPath);
        if (authParameters.dependsOn) {
          amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', authParameters.dependsOn);
        }
        const { print } = context;
        print.success(`Successfully updated resource ${resourceName} locally`);
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
