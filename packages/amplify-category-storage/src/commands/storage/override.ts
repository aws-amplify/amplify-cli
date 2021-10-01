/*
    entry code for amplify override root
*/

import path from 'path';
import { generateOverrideSkeleton, $TSContext, FeatureFlags } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { DynamoDBInputState } from '../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import { DDBStackTransform } from '../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';

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

    // Make sure to migrate first
    if (amplifyMeta[category][selectedResource].service === 'DynamoDB') {
      const resourceInputState = new DynamoDBInputState(selectedResource);
      if (!resourceInputState.cliInputFileExists()) {
        if (await amplify.confirmPrompt('File migration required to continue. Do you want to continue?', true)) {
          resourceInputState.migrate();
          const stackGenerator = new DDBStackTransform(selectedResource);
          stackGenerator.transform();
        } else {
          return;
        }
      }
    } else if (amplifyMeta[category][selectedResource].service === 'S3') {
      // S3 migration logic goes in here
    }

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
