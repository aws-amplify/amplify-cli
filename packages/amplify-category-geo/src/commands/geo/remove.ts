import { chooseServiceMessageRemove, provider } from '../../service-utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { $TSContext } from 'amplify-cli-core';
import { removeResource } from '../../provider-controllers';

export const name = 'remove';

export const run = async(context: $TSContext) => {
  const { amplify } = context;
  try {
    const result: {service: string, providerName: string} = await amplify.serviceSelectionPrompt(context, category, supportedServices, chooseServiceMessageRemove);

    if (result.providerName !== provider) {
      context.print.error(`Provider ${result.providerName} not configured for this category`);
      return;
    }

    return await removeResource(context, result.service);

  } catch (error) {
    context.print.info('');
    context.print.info(error.stack);
    context.print.error('There was an error removing the geo resource');
    context.usageData.emitError(error);
    process.exitCode = 1;
  }
};
