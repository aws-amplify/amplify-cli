import { categoryName } from "../../provider-utils/awscloudformation/utils/constants";
import { SUPPORTED_SERVICES } from "../../provider-utils/supported-services";

const subcommand = 'update';

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = SUPPORTED_SERVICES;
    return amplify
      .serviceSelectionPrompt(context, categoryName, servicesMetadata)
      .then(result => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.updateResource(context, categoryName, result.service);
      })
      .then(() => context.print.success('Successfully updated resource'))
      .catch(err => {
        context.print.error(err.stack);
      });
  },
};
