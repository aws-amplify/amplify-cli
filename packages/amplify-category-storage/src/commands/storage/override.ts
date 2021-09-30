/*
    entry code for amplify override root
*/

import path from 'path';
import { generateOverrideSkeleton, $TSContext, FeatureFlags } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';

const category = 'storage';
export const name = 'override';

export const run = async (context: $TSContext) => {
  if (FeatureFlags.getBoolean('overrides.project')) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();

    const storageResources: string[] = [];

    Object.keys(amplifyMeta[category]).forEach(resourceName => {
      storageResources.push(resourceName);
    });

    if (storageResources.length === 0) {
      const errMessage = 'No resources to override. You need to add a resource.';
      printer.error(errMessage);
      return;
    }

    let selectedResource: string = storageResources[0];

    if (storageResources.length > 1) {
      const resourceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'resource',
        message: 'Which resource would you like to add overrides for?',
        choices: storageResources,
      });
      selectedResource = resourceAnswer.resource;
    }

    const backendDir = context.amplify.pathManager.getBackendDirPath();
    const destPath = path.join(backendDir, category, selectedResource);
    fs.ensureDirSync(destPath);

    const srcPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'resources',
      'overrides-resource',
      amplifyMeta[category][selectedResource].service,
    );
    await generateOverrideSkeleton(context, srcPath, destPath);
  } else {
    printer.info('Storage overrides is currently not turned on. In amplify/cli.json file please include the following:');
    printer.info(`{
      override: {
         storage: true
      }
    }`);
  }
};
