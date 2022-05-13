import { $TSContext, $TSObject, AmplifyCategories, pathManager, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { messages } from '../assets/string-maps';

/**
 * Checks if auth already exists in the project and prints a warning if so.
 * Returns true if auth already exists, false otherwise
 */
export const projectHasAuth = (context: $TSContext): boolean => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const existingAuthResources: [string, $TSObject][] = Object.entries(meta?.auth || {});

  if (existingAuthResources.length > 0) {
    if (checkAuthIsImported(existingAuthResources)) {
      // determine which command will make the help message useful, defaults to 'import'
      const commandVerb = context?.input?.command && context.input.command !== 'update' ? context.input.command : 'import';
      printer.warn(
        'Auth has already been imported to this project and cannot be modified from the CLI. ' +
          `To modify, run "amplify remove auth" to unlink the imported auth resource. Then run "amplify ${commandVerb} auth".`,
      );
    } else {
      printer.warn(messages.authExists);
    }
    return true;
  }
  return false;
};

const checkAuthIsImported = (authResources: [string, $TSObject][]): boolean => {
  return authResources.filter(([_, resource]) => resource?.serviceType === 'imported').length > 0;
};

export const isAmplifyAuthPushed = (resourceName: string): boolean => {
  const meta = stateManager.getCurrentMeta(undefined, { throwIfNotExist: false });
  const existingAuthResources: [string, $TSObject][] = Object.entries(meta?.auth || {});

  if (existingAuthResources.length > 0) {
    if (!checkAuthIsImported(existingAuthResources)) {
      printer.warn('Auth has already been imported to this project and cannot be modified from the CLI.');
      return true;
    }
  }
  return false
}
