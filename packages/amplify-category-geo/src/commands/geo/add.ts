import { chooseServiceMessageAdd, provider } from '../../service-utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { addResource } from '../../provider-controllers';
import { printer } from 'amplify-prompts';

export const name = 'add';

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  try {
    const result: { service: string; providerName: string } = await amplify.serviceSelectionPrompt(
      context,
      category,
      supportedServices,
      chooseServiceMessageAdd,
    );

    if (result.providerName !== provider) {
      printer.error(`Provider ${result.providerName} not configured for this category`);
      return undefined;
    }

    return await addResource(context, result.service);
  } catch (error) {
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
  return undefined;
};
