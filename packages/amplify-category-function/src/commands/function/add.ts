import { chooseServiceMessageAdd } from '../../provider-utils/awscloudformation/utils/constants';
import { categoryName } from '../../constants';
import { supportedServices } from '../../provider-utils/supported-services';
import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

const subcommand = 'add';
export const name = subcommand;

export const run = async (context: $TSContext): Promise<void> => {
  const { amplify } = context;
  const servicesMetadata = supportedServices;

  try {
    const result = await amplify.serviceSelectionPrompt(context, categoryName, servicesMetadata, chooseServiceMessageAdd);
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      build: true,
    };
    const providerController = servicesMetadata[result.service].providerController;
    if (!providerController) {
      printer.error('Provider not configured for this category');
      return;
    }
    await providerController.addResource(context, categoryName, result.service, options);
    printer.blankLine();
  } catch (e) {
    throw new AmplifyFault(
      'ResourceAddFault',
      {
        message: 'There was an error adding the function resource',
      },
      e,
    );
  }
};
