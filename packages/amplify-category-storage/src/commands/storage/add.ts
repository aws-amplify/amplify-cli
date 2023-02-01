import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const name = 'add'; // subcommand

let options;

export async function run(context: $TSContext) {
  const { amplify } = context;
  const serviceMetadata = (await import('../../provider-utils/supported-services')).supportedServices;
  return amplify
    .serviceSelectionPrompt(context, categoryName, serviceMetadata)
    .then(async result => {
      options = {
        service: result.service,
        providerPlugin: result.providerName,
      };

      const providerController = await import(`../../provider-utils/${result.providerName}`);

      if (!providerController) {
        printer.error('Provider not configured for this category');
        return undefined;
      }

      return providerController.addResource(context, categoryName, result.service, options);
    })
    .then(resourceName => {
      if (resourceName) {
        printer.success(`Successfully added resource ${resourceName} locally`);
        printer.info('');
        printer.warn(
          'If a user is part of a user pool group, run "amplify update storage" to enable IAM group policies for CRUD operations',
        );
        printer.success('Some next steps:');
        printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
        printer.info(
          '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
        );
        printer.info('');
      }
    })
    .catch(async err => {
      if (err.message) {
        printer.error(err.message);
      }

      printer.error('An error occurred when adding the storage resource');

      if (err.stack) {
        printer.info(err.stack);
      }

      await context.usageData.emitError(err);

      process.exitCode = 1;
    });
}
