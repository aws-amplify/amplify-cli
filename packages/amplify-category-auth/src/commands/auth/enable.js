const { projectHasAuth } = require('../../provider-utils/awscloudformation/utils/project-has-auth');
const { getSupportedServices } = require('../../provider-utils/supported-services');
const subcommand = 'enable';
const category = 'auth';

module.exports = {
  name: subcommand,
  alias: ['add'],
  run: async context => {
    if (projectHasAuth(context)) {
      return;
    }
    const { amplify } = context;
    const servicesMetadata = getSupportedServices();
    return amplify.serviceSelectionPrompt(context, category, servicesMetadata).then(result => {
      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, result.service);
    });
  },
};
