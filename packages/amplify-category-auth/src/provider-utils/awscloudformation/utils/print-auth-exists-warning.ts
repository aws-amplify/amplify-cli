import { $TSContext, $TSObject, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { messages } from '../assets/string-maps';

export const printAuthExistsWarning = (context: $TSContext): void => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const existingAuthResources: [string, $TSObject][] = Object.entries(meta?.auth || {});
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
};

const checkAuthIsImported = (authResources: [string, $TSObject][]): boolean => {
  return authResources.filter(([, resource]) => resource?.serviceType === 'imported').length > 0;
};
