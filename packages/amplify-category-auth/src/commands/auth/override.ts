import path from 'path';
import { generateOverrideSkeleton, $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';
import { getAuthResourceName } from '../../utils/getAuthResourceName';

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
  let authResourceName;
  if (selectedAuthResource === 'userPoolGroups') {
    authResourceName = await getAuthResourceName(context);
    await checkAuthResourceMigration(context, authResourceName);
  } else {
    await checkAuthResourceMigration(context, selectedAuthResource);
  }

  // override structure for auth resource
  if (selectedAuthResource === 'userPoolGroups') {
    await generateOverrideforAuthResource(context, selectedAuthResource, 'userPoolGroups');
  } else {
    await generateOverrideforAuthResource(context, selectedAuthResource, 'auth');
  }
};

const generateOverrideforAuthResource = async (context: $TSContext, resourceName: string, resourceType: string) => {
  const backendDir = pathManager.getBackendDirPath();
  const destPath = path.normalize(path.join(backendDir, category, resourceName));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource', resourceType));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
