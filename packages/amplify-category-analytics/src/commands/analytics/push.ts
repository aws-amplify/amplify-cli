import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';

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
  return amplify.pushResources(context, category, resourceName);
};

export const name = subcommand;
