/*
    entry code for amplify override root
*/

//import { generateOverrideSkeleton } from '../../utils/override-skeleton-generator';
import path from 'path';
import { generateOverrideSkeleton } from 'amplify-cli-core';

const subcommand = 'override';

module.exports = {
  name: subcommand,
  run: async context => {
    const backendDir = context.amplify.pathManager.getBackendDirPath();

    const destPath = path.normalize(path.join(backendDir, 'awscloudformation', 'overrides'));
    const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

    await generateOverrideSkeleton(context, srcPath, destPath);
  },
};
