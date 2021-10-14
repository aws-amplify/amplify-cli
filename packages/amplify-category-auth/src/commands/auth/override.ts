import path from 'path';
import { generateOverrideSkeleton, $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';

const category = 'auth';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const authResources: string[] = [];
  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    authResources.push(resourceName);
  });
  if (authResources.length === 0) {
    const errMessage = 'No auth resources to override. Add auth using `amplify add auth`';
    printer.error(errMessage);
    return;
  }

  const selectedAuthResource = await prompter.pick<'one', string>(`Which resource would you like to add overrides for?`, authResources);
  // check if migration needed
  await checkAuthResourceMigration(context, selectedAuthResource);
  const backendDir = pathManager.getBackendDirPath();

  const destPath = path.normalize(path.join(backendDir, category, selectedAuthResource));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource'));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
