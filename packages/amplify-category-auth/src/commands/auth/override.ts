/*
    entry code for amplify override auth
*/
import path from 'path';
import { generateOverrideSkeleton, $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import * as inquirer from 'inquirer';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { CognitoCLIInputs } from '../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import { printer, prompter } from 'amplify-prompts';
import { migrateResourceToSupportOverride } from '../../provider-utils/awscloudformation/utils/migrate-override-resource';
import { generateAuthStackTemplate } from '../../provider-utils/awscloudformation/utils/generate-auth-stack-template';

const category = 'auth';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const authResources: string[] = [];
  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    authResources.push(resourceName);
  });
  if (authResources.length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    printer.error(errMessage);
    return;
  }

  let selectedAuthResource = authResources[0];

  if (authResources.length > 1) {
    const resourceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'resource',
      message: 'Which resource would you like to add overrides for?',
      choices: authResources,
    });
    selectedAuthResource = resourceAnswer.resource;
  }

  // check if migration needed
  let cliInputs: CognitoCLIInputs;
  try {
    const cliState = new AuthInputState(selectedAuthResource);
    cliInputs = cliState.getCLIInputPayload();
  } catch (err) {
    printer.warn('Cli-inputs.json doesnt exist');
    const isMigrate = await prompter.confirmContinue(`Do you want to migrate this ${selectedAuthResource} to support overrides?`);
    if (isMigrate) {
      migrateResourceToSupportOverride(selectedAuthResource);
      generateAuthStackTemplate(context, selectedAuthResource);
    } else {
      printer.warn('Turn off the feature flag to stay on existing state');
      return;
    }
  }

  const backendDir = pathManager.getBackendDirPath();

  const destPath = path.normalize(path.join(backendDir, category, selectedAuthResource));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
