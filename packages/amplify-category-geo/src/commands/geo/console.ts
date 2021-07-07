import { $TSContext } from 'amplify-cli-core';
import { openConsole } from '../../provider-controllers';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { provider } from '../../service-utils/constants';

export const name = 'console';

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  return amplify.serviceSelectionPrompt(context, category, supportedServices)
  .then((result: {service: string, providerName: string}) => {
    if (result.providerName !== provider) {
      context.print.error(`Provider ${result.providerName} not configured for this category`);
      return;
    }
    return openConsole(result.service);
  });
};
