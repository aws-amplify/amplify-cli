import { $TSContext, pathManager } from 'amplify-cli-core';
import { run as init } from '../init';
import fs from 'fs-extra';

export const run = async (context: $TSContext) => {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  if (!fs.existsSync(amplifyMetaFilePath)) {
    throw new Error(
      'Your workspace is not configured to modify the backend. If you wish to change this configuration, remove your `amplify` directory and pull the project again.',
    );
  }
  await init(context);
};
