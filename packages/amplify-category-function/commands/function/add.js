const fs = require('fs');

const subcommand = 'add';
const category = 'function';
const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));

let options;

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;

    return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          build: true,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not confgiured for this category');
          return;
        }
        return providerController.addResource(context, category, result.service, options);
      })
      .then((resourceName) => {
        const {print} = context;
        print.success(`Successfully added resource ${resourceName} locally.`);
        print.info('');
        print.success('Some next steps:');
        print.info(`Checkout sample function code generated in <project-dir>/amplify/backend/${resourceName}/src`);
        print.info(`"amplify function build" will build all your functions currently in the project`);
        print.info(`"amplify function invoke ${resourceName}" will allow you to test a function locally`);
        print.info(`"amplify publish" will build all your local resources and provision everything configured in the cloud`);
        print.info('');
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the function resource');
      });
  },
};
