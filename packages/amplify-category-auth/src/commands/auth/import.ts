import { $TSContext } from 'amplify-cli-core';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';

const category = 'auth';

export const run = async (context: $TSContext) => {
  if (projectHasAuth(context)) {
    return;
  }
  const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata);
  const providerController = require(`../../provider-utils/${serviceSelection.providerName}`);

  return providerController.importResource(context, serviceSelection);
};
