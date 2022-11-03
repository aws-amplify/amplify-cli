import { $TSContext, pathManager, AmplifyError } from 'amplify-cli-core';
import fs from 'fs-extra';
import { run as init } from '../init';

/**
 * Executes the 'env add' command
 */
export const run = async (context: $TSContext) : Promise<void> => {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  if (!fs.existsSync(amplifyMetaFilePath)) {
    throw new AmplifyError('ConfigurationError', {
      // eslint-disable-next-line spellcheck/spell-checker
      message: 'Your workspace is not configured to modify the backend.',
      resolution: 'If you wish to change this configuration, remove your `amplify` directory and pull the project again.',
    });
  }
  await init(context);
};
