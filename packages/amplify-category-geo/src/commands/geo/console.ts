import { $TSContext } from 'amplify-cli-core';
import { openConsole } from '../../provider-controllers';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { provider } from '../../service-utils/constants';
import { printer } from 'amplify-prompts';
import { verifySupportedRegion } from '../../service-utils/resourceUtils';

export const name = 'console';

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  if (!verifySupportedRegion()) {
    return;
  }

  const result: { service: string; providerName: string } = await amplify.serviceSelectionPrompt(context, category, supportedServices);

  if (result.providerName !== provider) {
    printer.error(`Provider ${result.providerName} not configured for this category`);
    return;
  }

  return openConsole(result.service);
};
