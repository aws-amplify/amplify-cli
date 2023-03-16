import path from 'path';
import { generateOverrideSkeleton, $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';
import { getAuthResourceName } from '../../utils/getAuthResourceName';

const category = 'auth';

export const name = 'overrides';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const authResources: string[] = [];
  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
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
    await checkAuthResourceMigration(context, authResourceName, false);
  } else {
    await checkAuthResourceMigration(context, selectedAuthResource, false);
  }

  // override structure for auth resource
  if (selectedAuthResource === 'userPoolGroups') {
    await generateOverrideForAuthResource(context, selectedAuthResource, 'userPoolGroups');
  } else {
    await generateOverrideForAuthResource(context, selectedAuthResource, 'auth');
  }
};

const generateOverrideForAuthResource = async (context: $TSContext, resourceName: string, resourceType: string) => {
  const backendDir = pathManager.getBackendDirPath();
  const destPath = path.normalize(path.join(backendDir, category, resourceName));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource', resourceType));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
