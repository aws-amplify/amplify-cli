import { $TSContext } from 'amplify-cli-core';
import { AmplifyCategories } from 'amplify-cli-core';

export const run = async (context: $TSContext) => {
  const nameOverrides = {
    S3: 'S3 bucket - Content (Images, audio, video, etc.)',
    DynamoDB: 'DynamoDB table - NoSQL Database',
  };

  const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, AmplifyCategories.STORAGE, servicesMetadata, undefined, nameOverrides);
  const providerController = require(`../../provider-utils/${serviceSelection.providerName}`);

  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }

  return providerController.importResource(context, AmplifyCategories.STORAGE, serviceSelection);
};
