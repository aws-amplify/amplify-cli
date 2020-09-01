const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');
const path = require('path');
const { projectHasAuth } = require('../../provider-utils/awscloudformation/utils/enforce-single-auth-resource');

const subcommand = 'enable';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  alias: ['add'],
  run: async context => {
    if (projectHasAuth(context)) return;
    const { amplify } = context;
    const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;
    return amplify.serviceSelectionPrompt(context, category, servicesMetadata).then(result => {
      options = {
        service: result.service,
        providerPlugin: result.providerName,
      };
      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, result.service);
    });
  },
};
