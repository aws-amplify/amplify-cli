const fs = require('fs');

const subcommand = 'add';
const category = 'storage';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));
const providerControllers = require('../../provider-utils/provider-controller-mapping');

let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile } = context;

    return awsmobile.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.provider,
        };
        const providerController = providerControllers[result.provider];
        return providerController.addResource(context, category, result.service);
      })
      .then(resourceName => awsmobile.updateAwsMobileMetaAfterResourceAdd(
        category,
        resourceName,
        options,
      ))
      .then(() => context.print.success('Successfully added resource'))
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the storage resource');
      });
  },
};
