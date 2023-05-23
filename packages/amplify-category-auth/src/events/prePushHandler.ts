import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { getAuthResourceName } from '../utils/getAuthResourceName';
import { projectHasAuth } from '../provider-utils/awscloudformation/utils/project-has-auth';
import { legacyAuthConfigHasTriggers } from '../utils/legacyAuthConfigHasTriggers';

/**
 * Auth with triggers configured in < v7 cannot be pushed with newer versions of the CLI
 * This handler checks if the project has triggers configured in parameters.json (the precursor to cli-inputs.json)
 * and if so exits the push with migration instructions.
 * @param context
 * @returns
 */
export const prePushHandler = async (context: $TSContext): Promise<void> => {
  // early return if project doesn't have auth
  if (!projectHasAuth()) {
    return;
  }

  const { imported } = context.amplify.getImportedAuthProperties(context);

  // early return if auth is imported
  if (imported) {
    return;
  }

  const authResourceName = await getAuthResourceName(context);

  // early return if the auth category is already using the new format
  const inputState = new AuthInputState(context, authResourceName);
  if (inputState.cliInputFileExists()) {
    return;
  }

  // early return if the legacy config does not include triggers
  if (!legacyAuthConfigHasTriggers(authResourceName)) {
    return;
  }

  // throw a migration error with instructions to migrate auth in order to continue
  throw new AmplifyError('InvalidMigrationError', {
    message: 'Auth triggers have been configured using an older version of the CLI and must be migrated before they can be deployed.',
    resolution: 'Run "amplify update auth" and select "yes" to the migration prompt. Then retry the deployment using "amplify push".',
  });
};
