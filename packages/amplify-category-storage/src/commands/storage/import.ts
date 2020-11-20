import { $TSContext } from 'amplify-cli-core';

const category = 'storage';

export const run = async (context: $TSContext) => {
  const nameOverrides = {
    S3: 'S3 bucket - Content (Images, audio, video, etc.)',
    DynamoDB: 'DynamoDB table - NoSQL Database',
  };

  const servicesMetadata = require('../../provider-utils/supported-services').supportedServices;

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata, undefined, nameOverrides);
  const providerController = require(`../../provider-utils/${serviceSelection.providerName}`);

  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }

  return providerController.importResource(context, category, serviceSelection);
};
