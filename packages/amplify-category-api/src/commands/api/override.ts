import { $TSContext, AmplifySupportedService, generateOverrideSkeleton, pathManager, stateManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as path from 'path';
import { category as categoryName } from '../../category-constants';
import { checkAppsyncApiResourceMigration } from '../../provider-utils/awscloudformation/utils/check-appsync-api-migration';

export const name = 'override';
export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const apiResources: string[] = [];
  if (amplifyMeta[categoryName]) {
    Object.keys(amplifyMeta[categoryName]).forEach(resourceName => {
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
  const { service }: { service: string } = amplifyMeta[categoryName][selectedResourceName];
  const destPath = pathManager.getResourceDirectoryPath(undefined, categoryName, selectedResourceName);
  const srcPath = path.join(__dirname, '..', '..', '..', 'resources', 'awscloudformation', 'overrides-resource', service);
  // Make sure to migrate first
  if (service === AmplifySupportedService.APPSYNC) {
    await checkAppsyncApiResourceMigration(context, selectedResourceName);
    // fetch cli Inputs again
    // call compile schema here
    await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [context, { forceCompile: true }]);
  }
  await generateOverrideSkeleton(context, srcPath, destPath);
};
