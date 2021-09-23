import { chooseServiceMessageUpdate, provider } from '../../service-utils/constants';
import { category, supportedRegions } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { $TSAny, $TSContext, stateManager } from 'amplify-cli-core';
import { updateResource, unsupportedRegionMessage } from '../../provider-controllers';
import { printer } from 'amplify-prompts';

export const name = 'update';

export const run = async(context: $TSContext) => {
  const { amplify } = context;
  try {
    const region = stateManager.getMeta()?.providers[provider]?.Region;
    if(!supportedRegions.includes(region)) {
      printer.error(unsupportedRegionMessage(region));
      return;
    }

    const result: {service: string, providerName: string} = await amplify.serviceSelectionPrompt(context, category, supportedServices, chooseServiceMessageUpdate);

    if (result.providerName !== provider) {
      printer.error(`Provider ${result.providerName} not configured for this category`);
      return;
    }

    return await updateResource(context, result.service);

  } catch (error:$TSAny) {
    if (error.message) {
      printer.error(error.message);
    }
    printer.blankLine();
    if (error.stack) {
      printer.info(error.stack);
    }
    printer.error('There was an error updating the geo resource');
    context.usageData.emitError(error);
    process.exitCode = 1;
  }
};
