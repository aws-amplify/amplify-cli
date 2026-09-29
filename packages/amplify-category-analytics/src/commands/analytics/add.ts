/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

const subcommand = 'add';
const category = 'analytics';

let options: $TSAny;

/**
 * Add handling for Analytics resource
 * @param context amplify cli context
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify } = context;
  const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
  printer.warn(`Amazon Pinpoint is reaching end of life on October 30, 2026 and no longer accepts new customers as of May 20, 2025.
    It is recommended you use Kinesis for event collection and mobile analytics instead.\n`);

  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata, 'Select an Analytics provider')
    .then((result) => {
      options = {
        service: result.service,
        providerPlugin: result.providerName,
      };
      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        printer.error('Provider not configured for this category');
        return undefined;
      }
      return providerController.addResource(context, category, result.service);
    })
    .then((resourceName) => {
      if (resourceName) {
        amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
        printer.success(`Successfully added resource ${resourceName} locally`);
        printer.info('');
        printer.success('Some next steps:');
        printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
        printer.info(
          '"amplify publish" builds all your local backend and front-end resources (if you have hosting category added) and provisions them in the cloud',
        );
        printer.info('');
      }
    })
    .catch((err) => {
      printer.info(err.stack);
      printer.error('There was an error adding the analytics resource');
      void context.usageData.emitError(err);
      process.exitCode = 1;
    });
};

export const name = subcommand;
