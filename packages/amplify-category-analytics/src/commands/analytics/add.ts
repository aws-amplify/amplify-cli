/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSAny, $TSContext } from 'amplify-cli-core';

const subcommand = 'add';
const category = 'analytics';

let options: $TSAny;

/**
 * Add handling for Analytics resource
 * @param context amplify cli context
 */
export const run = async (context : $TSContext):Promise<$TSAny> => {
  const { amplify } = context;
  const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata, 'Select an Analytics provider')
    .then((result: $TSAny): $TSAny => {
      options = {
        service: result.service,
        providerPlugin: result.providerName,
      };
      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      // eslint-disable-next-line consistent-return
      return providerController.addResource(context, category, result.service);
    })
    .then(resourceName => {
      if (resourceName) {
        amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
        const { print } = context;
        print.success(`Successfully added resource ${resourceName} locally`);
        print.info('');
        print.success('Some next steps:');
        print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
        print.info(
          '"amplify publish" builds all your local backend and front-end resources (if you have hosting category added) and provisions them in the cloud',
        );
        print.info('');
      }
    })
    .catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the analytics resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
};

module.exports = {
  name: subcommand,
  run,
};
