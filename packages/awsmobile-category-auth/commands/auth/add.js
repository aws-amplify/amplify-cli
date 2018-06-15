const fs = require('fs');

const subcommand = 'add';
const category = 'auth';
let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile } = context;
    const configure = context.parameters.options.configure ? '-configure' : '';
    const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services${configure}.json`));

    return awsmobile.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.provider,
        };
        const providerController = require(`../../provider-utils/${result.provider}/index`);
        if (!providerController) {
          context.print.error('Provider not confgiured for this category');
          return;
        }
        return providerController.addResource(context, category, result.service, configure);
      })
      .then((resourceName) => {
        awsmobile.updateAwsMobileMetaAfterResourceAdd(category, resourceName, options);
      })
      .then(() => context.print.success('Successfully added resource'))
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the auth resource');
      });
  },
};
