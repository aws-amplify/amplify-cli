const fs = require('fs');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');


const subcommand = 'update';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  alias: ['update'],
  run: async (context) => {
    const { amplify } = context;
    const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));
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
    context.updatingAuth = JSON.parse(fs.readFileSync(`${amplify.pathManager.getBackendDirPath()}/auth/${resourceName}/parameters.json`));

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
        return providerController.updateResource(context, category, result.service);
      })
      .then((resourceName) => { // eslint-disable-line no-shadow
        amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, options);
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
