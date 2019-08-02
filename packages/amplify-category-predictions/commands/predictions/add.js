import { promptCategory } from '../../provider-utils/supportedPredictions';

const subcommand = 'add';
const category = 'predictions';
let options;


module.exports = {
  name: subcommand,
  run: async context => promptCategory()
    .then((result) => {
      result = result.predictionsCategory;
      options = {
        providerPlugin: result.provider,
      };
      const providerController = require(`../../provider-utils/${result.provider}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, category, result.fileName, options);
    })
    .then((resourceName) => {
      const { print } = context;
      print.success(`Successfully added resource ${resourceName} locally`);
      print.info('');
      print.success('Some next steps:');
      print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
      print.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
      print.info('');
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('An error occurred when adding the predictions resource');
    }),
};
