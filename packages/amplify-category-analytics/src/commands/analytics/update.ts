import { $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

const subcommand = 'update';
const category = 'analytics';

/**
 * Update resource handler for Analytics category
 * @param context amplify cli context
 * @returns response from the resource's update function
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify } = context;
  const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
  printer.warn(`Amazon Pinpoint is reaching end of life on October 30, 2026 and no longer accepts new customers as of May 20, 2025.
    If you are using Pinpoint, we recommended you use Kinesis for event collection and mobile analytics instead.`);

  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then((result) => {
      const options = {
        service: result.service,
        providerPlugin: result.providerName,
      };

      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const providerController = require(`../../provider-utils/${result.providerName}/index`);
      if (!providerController) {
        printer.error('Provider not configured for this category');
        return undefined;
      }

      return providerController.updateResource(context, category, result.service, options);
    })
    .then((resourceName) => {
      printer.success(`Successfully updated resource ${resourceName} locally`);
      printer.info('');
      printer.success('Some next steps:');
      printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
      printer.info(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      );
      printer.info('');
    })
    .catch((err) => {
      printer.info(err.stack);
      printer.error(`There was an error updating the ${category} resource`);
      void context.usageData.emitError(err);
      process.exitCode = 1;
    });
};

export const name = subcommand;
export const alias = ['configure'];
