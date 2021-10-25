import path from 'path';
import { generateOverrideSkeleton, $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
//import { checkAuResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';

const category = 'api';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const apiResources: string[] = [];
  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    apiResources.push(resourceName);
  });
  if (apiResources.length === 0) {
    const errMessage = 'No api resources to override. Add auth using `amplify api auth`';
    printer.error(errMessage);
    return;
  }

  const selectedApiResource = await prompter.pick<'one', string>(`Which resource would you like to add overrides for?`, apiResources);
  // check if migration needed
  //await checkAuthResourceMigration(context, selectedAuthResource);
  const backendDir = pathManager.getBackendDirPath();

  const destPath = path.normalize(path.join(backendDir, category, selectedApiResource));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
