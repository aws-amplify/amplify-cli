import { $TSAny, $TSContext } from 'amplify-cli-core';

const subcommand = 'push';
const category = 'analytics';
/**
 * Push flow for analytics category. Generates CFN from parameters, deploys to the cloud and updates amplify-meta.json
 * @param context amplify cli context
 * @returns deployment status
 */
export const run = async (context : $TSContext) : Promise<$TSAny> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  context.amplify.constructExeInfo(context);
  let result;
  try {
    result = await amplify.pushResources(context, category, resourceName);
  } catch (err: $TSAny) {
    context.print.info(err.stack as string);
    context.print.error('An error occurred when pushing the analytics resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return result;
};
module.exports = {
  name: subcommand,
  run,
};
