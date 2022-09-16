import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const subcommand = 'remove';
const category = 'analytics';

/**
 * Analytics remove resource handler.
 * @param context amplify cli context
 * @returns removeResource response
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;

  return amplify.removeResource(context, category, resourceName).catch(err => {
    printer.info(err.stack);
    printer.error('An error occurred when removing the analytics resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  });
};

export const name = subcommand;
