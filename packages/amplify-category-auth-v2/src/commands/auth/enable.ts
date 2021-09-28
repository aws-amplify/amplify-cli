import { $TSContext } from 'amplify-cli-core';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
export const name = 'enable';
export const category = 'auth';
export const alias = ['add'];

export const run = async (context: $TSContext) => {
  if (projectHasAuth(context)) {
    return;
  }
  const { amplify } = context;
  const servicesMetadata = (await import('../../provider-utils/supported-services')).supportedServices;
  const serviceSelectionPromptResult = await amplify.serviceSelectionPrompt(context, category, servicesMetadata);
  const providerController = await import(`../../provider-utils/${serviceSelectionPromptResult.providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.addResource(context, serviceSelectionPromptResult.service);
};
