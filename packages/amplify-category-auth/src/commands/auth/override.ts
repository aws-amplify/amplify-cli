/*
    entry code for amplify override auth
*/

import path from 'path';
import { generateOverrideSkeleton, $TSContext } from 'amplify-cli-core';
const inquirer = require('inquirer');

const subcommand = 'override';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context: $TSContext) => {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();

    const authResources: string[] = [];

    Object.keys(amplifyMeta[category]).forEach(resourceName => {
      authResources.push(resourceName);
    });
    if (authResources.length === 0) {
      const errMessage = 'No resources to update. You need to add a resource.';
      context.print.error(errMessage);
      return;
    }

    if (authResources.length > 1) {
      const resourceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'resource',
        message: 'Which resource would you like to add overrides for?',
        choices: authResources,
      });

      const backendDir = context.amplify.pathManager.getBackendDirPath();

      const destPath = path.normalize(path.join(backendDir, category, resourceAnswer.resource, 'overrides'));
      const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

      await generateOverrideSkeleton(context, srcPath, destPath);
    }
  },
};
