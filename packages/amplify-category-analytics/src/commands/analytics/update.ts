/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSAny, $TSContext } from 'amplify-cli-core';

const subcommand = 'update';
const category = 'analytics';
/**
 * Update resource handler for Analytics category
 * @param context amplify cli context
 * @returns response from the resource's update function
 */
export const run = async (context: $TSContext):Promise<$TSAny> => {
  const { amplify } = context;
  const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);

  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then(result => {
      const options = {
        service: result.service,
        providerPlugin: result.providerName,
      };

      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }

      // eslint-disable-next-line consistent-return
      return providerController.updateResource(context, category, result.service, options);
    })
    .then(resourceName => {
      const { print } = context;
      print.success(`Successfully updated resource ${resourceName} locally`);
      print.info('');
      print.success('Some next steps:');
      print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
      print.info(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      );
      print.info('');
    })
    .catch(err => {
      context.print.info(err.stack);
      context.print.error(`There was an error updating the ${category} resource`);
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
};

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run,
};
