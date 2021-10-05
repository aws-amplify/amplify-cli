import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

const subcommand = 'console';
const category = 'api';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const servicesMetadata = (await import(path.join('..', '..', 'provider-utils', 'supported-services'))).supportedServices;
  return context.amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then(async result => {
      const providerController = await import(path.join('..', '..', 'provider-utils', result.providerName, 'index'));
      if (!providerController) {
        throw new Error(`Provider "${result.providerName}" is not configured for this category`);
      }
      return await providerController.console(context, result.service);
    })
    .catch(async err => {
      printer.error('Error opening console.');
      printer.info(err.message);
      await context.usageData.emitError(err);
      process.exitCode = 1;
    });
};
