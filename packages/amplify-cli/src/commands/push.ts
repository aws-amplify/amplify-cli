import { $TSAny, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { updateCognitoTrackedFiles } from '../extensions/amplify-helpers/update-tracked-files';
import { syncCurrentCloudBackend } from '../extensions/amplify-helpers/current-cloud-backend-utils';

/**
 * Updates tracked files for auto updates in the build directory that will not be detected for 'amplify push'
 */
const updateTrackedFiles = async (): Promise<void> => {
  await updateCognitoTrackedFiles();
};

/**
 * Runs push command
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  context.amplify.constructExeInfo(context);
  if (context.exeInfo.localEnvInfo.noUpdateBackend) {
    throw new AmplifyError('NoUpdateBackendError', { message: 'The local environment configuration does not allow backend updates.' });
  }
  if (context.parameters.options?.force) {
    context.exeInfo.forcePush = true;
  }

  // force flag ignores project status check
  if (!context.exeInfo.forcePush) {
    await syncCurrentCloudBackend(context);
  }

  await updateTrackedFiles();
  return context.amplify.pushResources(context);
};
