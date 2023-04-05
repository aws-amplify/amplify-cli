import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { getAuthResourceName } from '../utils/getAuthResourceName';
import { projectHasAuth } from '../provider-utils/awscloudformation/utils/project-has-auth';

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

  // check that auth config has been migrated from parameters.json to cli-inputs.json
  const authResourceName = await getAuthResourceName(context);

  const inputState = new AuthInputState(context, authResourceName);
  if (!inputState.cliInputFileExists()) {
    throw new AmplifyError('InvalidMigrationError', {
      message: 'Auth configuration needs to be migrated before pushing.',
      resolution: 'Run "amplify update auth" and select "yes" to the migration prompt to proceed',
    });
  }
};
