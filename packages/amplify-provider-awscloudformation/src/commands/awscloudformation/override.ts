/*
    entry code for amplify override root
*/

import path from 'path';
import { generateOverrideSkeleton, $TSContext, FeatureFlags } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const subcommand = 'override';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  if (FeatureFlags.getBoolean('overrides.project')) {
    const backendDir = context.amplify.pathManager.getBackendDirPath();

    const destPath = path.normalize(path.join(backendDir, 'awscloudformation'));
    const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

    await generateOverrideSkeleton(context, srcPath, destPath);
  } else {
    printer.info('Overrides are not enabled for Root stack . Turn overrides.project = true in cli.json');
  }
};
