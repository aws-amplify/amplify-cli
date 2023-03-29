import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { getAuthResourceName } from '../utils/getAuthResourceName';

export const prePushHandler = async (context: $TSContext): Promise<void> => {
  const inputState = new AuthInputState(context, await getAuthResourceName(context));
  if (!inputState.cliInputFileExists()) {
    throw new AmplifyError('InvalidMigrationError', {
      message: 'Auth configuration needs to be migrated before pushing.',
      resolution: 'Run "amplify update auth" and select "yes" to the migration prompt to proceed',
    });
  }
};
