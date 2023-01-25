import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const run = async (context: $TSContext) => {
  const nameOverrides = {
    S3: 'S3 bucket - Content (Images, audio, video, etc.)',
    DynamoDB: 'DynamoDB table - NoSQL Database',
  };

  const servicesMetadata = ((await import('../../provider-utils/supported-services')) as $TSAny).supportedServices;

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, categoryName, servicesMetadata, undefined, nameOverrides);
  const providerController = await import(`../../provider-utils/${serviceSelection.providerName}`);

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return undefined;
  }

  return providerController.importResource(context, categoryName, serviceSelection);
};
