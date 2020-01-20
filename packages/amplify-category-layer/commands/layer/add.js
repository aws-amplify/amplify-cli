const subcommand = 'add';
const category = 'layer';

let options;

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then(result => {
        options = {
          service: result.service,
          providerPlugin: result.providerName,
          build: true,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return;
        }
        return providerController.addResource(context, category, result.service, options);
      })
      .then(resourceName => {
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally.`);
        print.info('');
        print.success('Next steps:');
        print.info(`Check out sample layer code generated in <project-dir>/amplify/backend/layer/${resourceName}/src`);
        print.info('"amplify layer build" builds all of your layer currently in the project');
        print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
        print.info(
          '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
        );
        print.info('');
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the layer resource');
      });
  },
};
