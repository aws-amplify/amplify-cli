import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  generateOverrideSkeleton,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as path from 'path';
import { ApigwInputState } from '../../provider-utils/awscloudformation/apigw-input-state';
import { ApigwStackTransform } from '../../provider-utils/awscloudformation/cdk-stack-builder';

export const name = 'override';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const apiResources: string[] = [];

  if (amplifyMeta[AmplifyCategories.API]) {
    Object.keys(amplifyMeta[AmplifyCategories.API]).forEach(resourceName => {
      apiResources.push(resourceName);
    });
  }

  if (apiResources.length === 0) {
    const errMessage = 'No resources to override. You need to add a resource.';
    printer.error(errMessage);
    return;
  }

  let selectedResourceName: string = apiResources[0];

  if (apiResources.length > 1) {
    selectedResourceName = await prompter.pick('Which resource would you like to add overrides for?', apiResources);
  }

  const { service }: { service: string } = amplifyMeta[AmplifyCategories.API][selectedResourceName];
  const destPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, selectedResourceName);

  const srcPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'resources',
    'awscloudformation',
    'overrides-resource',
    service === AmplifySupportedService.APIGW ? 'APIGW' : service, // avoid space in filename
  );

  // Make sure to migrate first
  if (service === AmplifySupportedService.APPSYNC) {
    if (await checkAppsyncApiResourceMigration(context, selectedResourceName)) {
      // fetch cli Inputs again
      // call compile schema here
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [context, { forceCompile: true }]);
      await generateOverrideSkeleton(context, srcPath, destPath);
    }
  } else if (service === AmplifySupportedService.APIGW) {
    // Migration logic goes in here
    const apigwInputState = ApigwInputState.getInstance(context, selectedResourceName);
    if (!apigwInputState.cliInputsFileExists()) {
      if (await prompter.yesOrNo('File migration required to continue. Do you want to continue?', true)) {
        await apigwInputState.migrateApigwResource(selectedResourceName);
        const stackGenerator = new ApigwStackTransform(context, selectedResourceName);
        stackGenerator.transform();
        await generateOverrideSkeleton(context, srcPath, destPath);
      } else {
        return;
      }
    }
  }
};
