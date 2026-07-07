import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { run as runHelp } from './analytics/help';

export { run as analyticsPush } from './analytics/push';
export const name = 'analytics';

/**
 * Analytics category command router. Invokes functionality for all CLI calls
 * @param context amplify cli context
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  if (context.parameters.options?.help) {
    return runHelp(context);
  }
  if (/^win/.test(process.platform)) {
    const { run: runCommand } = await import(`./${name}/${context.parameters.first}`);
    return runCommand(context);
  }
  return context;
};
