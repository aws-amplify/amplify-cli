import { chooseServiceMessageAdd, provider } from '../../service-utils/constants';
import { category, supportedRegions } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { $TSAny, $TSContext, stateManager } from 'amplify-cli-core';
import { addResource, unsupportedRegionMessage } from '../../provider-controllers';
import { printer } from 'amplify-prompts';

export const name = 'add';

export const run = async(context: $TSContext) => {
  const { amplify } = context;
  try {
    const region = stateManager.getMeta()?.providers[provider]?.Region;
    if(!supportedRegions.includes(region)) {
      printer.error(unsupportedRegionMessage(region));
      return;
    }

    const result: {service: string, providerName: string} = await amplify.serviceSelectionPrompt(context, category, supportedServices, chooseServiceMessageAdd);

    if (result.providerName !== provider) {
      printer.error(`Provider ${result.providerName} not configured for this category`);
      return;
    }

    return await addResource(context, result.service);

  } catch (error: $TSAny) {
    if (error.message) {
      printer.error(error.message);
    }
    printer.blankLine();
    if (error.stack) {
      printer.info(error.stack);
    }
    printer.error('There was an error adding the geo resource');
    context.usageData.emitError(error);
    process.exitCode = 1;
  }
};
