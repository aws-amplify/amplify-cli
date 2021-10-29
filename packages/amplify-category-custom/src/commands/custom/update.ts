import { $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { updateCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';
import { categoryName, cdkFileName, CDK_SERVICE_NAME, CFN_SERVICE_NAME } from '../../utils/constants';
import * as path from 'path';

export const name = 'update';

export async function run(context: $TSContext) {
  const amplifyMeta = stateManager.getMeta();
  const customResources = categoryName in amplifyMeta ? Object.keys(amplifyMeta[categoryName]) : [];

  if (customResources.length > 0) {
    const resourceName = await prompter.pick('Select the custom resource to update', customResources);
    if (amplifyMeta[categoryName][resourceName].service === CDK_SERVICE_NAME) {
      const resourceDirPath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
      const cdkFilepath = path.join(resourceDirPath, cdkFileName);

      if (await prompter.yesOrNo('Do you want to edit the CDK stack now?', true)) {
        await context.amplify.openEditor(context, cdkFilepath);
      }
    } else if (amplifyMeta[categoryName][resourceName].service === CFN_SERVICE_NAME) {
      await updateCloudFormationWalkthrough(context, resourceName);
    } else {
      printer.error('Resource update is not currently supported');
    }
  } else {
    printer.error('No custom resources found.');
  }
}
