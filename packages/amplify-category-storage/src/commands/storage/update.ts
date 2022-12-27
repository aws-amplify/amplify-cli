import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const name = 'update'; // subcommand
export const alias = ['configure'];

export async function run(context: $TSContext) {
  const { amplify } = context;
  const serviceMetadata = (await import('../../provider-utils/supported-services')).supportedServices;

  return amplify
    .serviceSelectionPrompt(context, categoryName, serviceMetadata)
    .then(async result => {
      const providerController = await import(`../../provider-utils/${result.providerName}`);

      if (!providerController) {
        printer.error('Provider not configured for this category');
        return undefined;
      }

      return providerController.updateResource(context, categoryName, result.service);
    })
    .then(result => {
      if (result) {
        printer.success('Successfully updated resource');
      }
    })
    .catch(async err => {
      if (err.stack) {
        printer.info(err.stack);
      }
      printer.error('An error occurred when updating the storage resource');

      await context.usageData.emitError(err);

      process.exitCode = 1;
    });
}
