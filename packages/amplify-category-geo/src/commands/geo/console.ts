import { $TSContext, stateManager } from 'amplify-cli-core';
import { openConsole, unsupportedRegionMessage } from '../../provider-controllers';
import { category, supportedRegions } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { provider } from '../../service-utils/constants';
import { printer } from 'amplify-prompts';

export const name = 'console';

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  const region = stateManager.getMeta()?.providers[provider]?.Region;
  if(!supportedRegions.includes(region)) {
    printer.error(unsupportedRegionMessage(region));
    return;
  }

  const result: {service: string, providerName: string} = await amplify.serviceSelectionPrompt(context, category, supportedServices);

  if (result.providerName !== provider) {
    printer.error(`Provider ${result.providerName} not configured for this category`);
    return;
  }

  return openConsole(result.service);
};
