import { $TSContext, $TSObject, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { messages } from '../assets/string-maps';

/**
 * Checks if auth already exists in the project and prints a warning if so.
 * Returns true if auth already exists, false otherwise
 */
export const projectHasAuth = (context: $TSContext) => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const existingAuth: [string, $TSObject][] = Object.entries(meta?.auth || {});

  if (existingAuth.length > 0) {
    if (existingAuth.filter(([_, resource]) => resource?.serviceType === 'imported').length > 0) {
      const command = !context?.input?.command || context.input.command === 'update' ? 'import' : context.input.command;
      printer.warn(
        'Auth has already been imported to this project and cannot be modified from the CLI. ' +
          `To modify, run "amplify remove auth" to unlink the imported auth resource. Then run "amplify ${command} auth".`,
      );
    } else {
      printer.warn(messages.authExists);
    }
    return true;
  }
  return false;
};
