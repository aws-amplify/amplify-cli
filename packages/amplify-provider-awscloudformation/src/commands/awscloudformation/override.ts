/*
    entry code for amplify override root
*/

import path from 'path';
import { generateOverrideSkeleton, $TSContext } from 'amplify-cli-core';

const subcommand = 'override';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  const backendDir = context.amplify.pathManager.getBackendDirPath();

  const destPath = path.normalize(path.join(backendDir, 'awscloudformation'));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
