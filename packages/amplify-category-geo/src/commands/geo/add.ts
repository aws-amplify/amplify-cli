import { chooseServiceMessageAdd, provider } from '../../service-utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../supportedServices';
import { $TSContext } from 'amplify-cli-core';
import { addResource } from '../../provider-controllers';

export const name = 'add';

export const run = async(context: $TSContext) => {
  const { amplify } = context;
    return amplify
      .serviceSelectionPrompt(context, category, supportedServices, chooseServiceMessageAdd)
      .then((result: {service: string, providerName: string}) => {
        if (result.providerName !== provider) {
          context.print.error(`Provider ${result.providerName} not configured for this category`);
          return;
        }
        return addResource(context, result.service);
      })
      .then(() => {
        context.print.info('');
      })
      .catch((err: any) => {
        context.print.info(err.stack);
        context.print.error('There was an error adding the geo resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
};
