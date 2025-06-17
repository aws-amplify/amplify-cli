import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

const subcommand = 'push';
const category = 'analytics';
/**
 * Push flow for analytics category. Generates CFN from parameters, deploys to the cloud and updates amplify-meta.json
 * @param context amplify cli context
 * @returns deployment status
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  context.amplify.constructExeInfo(context);
  printer.warn(`Amazon Pinpoint is reaching end of life on October 30, 2026 and no longer accepts new customers as of May 20, 2025.
      If you are using Pinpoint, it is recommended you use Kinesis for event collection and mobile analytics instead.\n`);
  return amplify.pushResources(context, category, resourceName);
};

export const name = subcommand;
