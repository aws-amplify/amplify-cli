import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
import { getSupportedServices } from '../../provider-utils/supported-services';

export const name = 'enable';
export const category = 'auth';
export const alias = ['add'];

export const run = async (context: $TSContext) => {
  if (projectHasAuth(context)) {
    return;
  }
  const { amplify } = context;
  const serviceSelectionPromptResult = await amplify.serviceSelectionPrompt(context, category, getSupportedServices());
  const providerController = await import(path.join(`..`, `..`, `provider-utils`, `${serviceSelectionPromptResult.providerName}`, `index`));
  if (!providerController) {
    printer.error('Provider not configured for this category');
    return;
  }
  return providerController.addResource(context, serviceSelectionPromptResult.service);
};
