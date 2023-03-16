import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { run as runHelp } from './auth/help';

export const name = 'auth';

/**
 * Execute all auth cli commands
 * @param context amplify cli context
 * @returns auth command response
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  if (context.parameters.options?.help) {
    return runHelp(context);
  }
  try {
    if (!context.parameters.first) {
      throw new TypeError('Missing command');
    }
    const { run: authRun } = await import(path.join('.', name, context.parameters.first));
    return authRun(context);
  } catch (err) {
    printer.error('Command not found');
  }
  return undefined;
};
