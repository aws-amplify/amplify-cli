import { $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

const subcommand = 'update';

export const name = subcommand;
export const alias = ['configure'];

export const run = async (context: $TSContext) => {
  const servicesMetadata = (await import(path.join('..', '..', 'provider-utils', 'supported-services'))).supportedServices;

  return context.amplify
    .serviceSelectionPrompt(context, AmplifyCategories.API, servicesMetadata)
    .then(async result => {
      const providerController = await import(path.join('..', '..', 'provider-utils', result.providerName, 'index'));
      if (!providerController) {
        printer.error('Provider not configured for this category');
        return;
      }
      return providerController.updateResource(context, AmplifyCategories.API, result.service);
    })
    .then(() => printer.success('Successfully updated resource'));
};
