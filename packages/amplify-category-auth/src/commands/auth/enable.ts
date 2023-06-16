import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { printAuthExistsWarning } from '../../provider-utils/awscloudformation/utils/print-auth-exists-warning';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
import { getSupportedServices } from '../../provider-utils/supported-services';

export const name = 'enable';
export const category = 'auth';
export const alias = ['add'];

export const run = async (context: $TSContext) => {
  if (projectHasAuth()) {
    printAuthExistsWarning(context);
    return undefined;
  }
  const { amplify } = context;
  const serviceSelectionPromptResult = await amplify.serviceSelectionPrompt(context, category, getSupportedServices());
  const providerController = await import(path.join(`..`, `..`, `provider-utils`, `${serviceSelectionPromptResult.providerName}`, `index`));
  if (!providerController) {
    printer.error('Provider not configured for this category');
    return undefined;
  }
  return providerController.addResource(context, serviceSelectionPromptResult.service);
};
