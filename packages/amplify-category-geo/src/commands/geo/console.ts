import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { openConsole } from '../../provider-controllers';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { provider } from '../../service-utils/constants';
import { printer } from '@aws-amplify/amplify-prompts';

export const name = 'console';

export const run = async (context: $TSContext): Promise<void> => {
  const { amplify } = context;
  const result: { service: string; providerName: string } = await amplify.serviceSelectionPrompt(context, category, supportedServices);

  if (result.providerName !== provider) {
    printer.error(`Provider ${result.providerName} not configured for this category`);
    return;
  }
  await openConsole(result.service);
};
