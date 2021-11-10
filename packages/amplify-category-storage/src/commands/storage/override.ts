/*
  entry code for amplify override root
*/

import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  CLISubCommandType,
  generateOverrideSkeleton,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import chalk from 'chalk';
import { EOL } from 'os';
import * as path from 'path';
import { DDBStackTransform } from '../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import { AmplifyS3ResourceStackTransform } from '../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import { DynamoDBInputState } from '../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import { S3InputState } from '../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state';

export const name = 'override';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const storageResources: string[] = [];

  if (amplifyMeta[AmplifyCategories.STORAGE]) {
    Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach(resourceName => {
      storageResources.push(resourceName);
    });
  }

  if (storageResources.length === 0) {
    const errMessage = 'No resources to override. You need to add a resource.';
    printer.error(errMessage);
    return;
  }

  let selectedResourceName: string = storageResources[0];

  if (storageResources.length > 1) {
    selectedResourceName = await prompter.pick('Which resource would you like to add overrides for?', storageResources);
  }

  const destPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.STORAGE, selectedResourceName);

  const srcPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'resources',
    'overrides-resource',
    amplifyMeta[AmplifyCategories.STORAGE][selectedResourceName].service,
  );

  const docsLink = 'https://docs.amplify.aws/cli/migration/overrides';
  const migrateResourceMessage = [
    `Do you want to migrate ${AmplifyCategories.STORAGE} resource "${selectedResourceName}" to support overrides?`,
    chalk.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
    `Learn more about this migration: ${docsLink}`,
  ].join(EOL);

  // Make sure to migrate first
  if (amplifyMeta[AmplifyCategories.STORAGE][selectedResourceName].service === AmplifySupportedService.DYNAMODB) {
    const resourceInputState = new DynamoDBInputState(selectedResourceName);
    if (!resourceInputState.cliInputFileExists()) {
      if (await prompter.yesOrNo(migrateResourceMessage, true)) {
        resourceInputState.migrate();
        const stackGenerator = new DDBStackTransform(selectedResourceName);
        await stackGenerator.transform();
      } else {
        return;
      }
    }
  } else if (amplifyMeta[AmplifyCategories.STORAGE][selectedResourceName].service === AmplifySupportedService.S3) {
    // S3 migration logic goes in here
    const s3ResourceInputState = new S3InputState(selectedResourceName, undefined);
    if (!s3ResourceInputState.cliInputFileExists()) {
      if (await prompter.yesOrNo(migrateResourceMessage, true)) {
        await s3ResourceInputState.migrate(context); //migrate auth and storage config resources
        const stackGenerator = new AmplifyS3ResourceStackTransform(selectedResourceName, context);
        stackGenerator.transform(CLISubCommandType.MIGRATE);
      } else {
        return;
      }
    }
  }

  await generateOverrideSkeleton(context, srcPath, destPath);
};
