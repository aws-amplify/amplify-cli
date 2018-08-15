const fs = require('fs');

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

    const dependentResources = Object.keys(amplify.getProjectDetails().amplifyMeta).some(e => ['analytics', 'api', 'storage', 'function'].includes(e));

    if (dependentResources) {
      context.print.info('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
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
        amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
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
