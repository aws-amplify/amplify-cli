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
  // dont need this prompt since userPool group is handled via auth cli-inputs
  let selectedAuthResource = await prompter.pick<'one', string>(`Which resource would you like to add overrides for?`, authResources);
  // check if migration needed
  let userPoolGroupResource = undefined;
  if (selectedAuthResource === 'userPoolGroups') {
    selectedAuthResource = authResources.filter(resource => resource !== 'userPoolGroups')[0];
    userPoolGroupResource = 'userPoolGroups';
  }
  await checkAuthResourceMigration(context, selectedAuthResource);

  // override structure for auth resource
  await generateOverrideforAuthResource(context, selectedAuthResource, 'auth');

  // override structure for userPool Group resource
  if (userPoolGroupResource) {
    await generateOverrideforAuthResource(context, userPoolGroupResource, 'userPoolGroups');
  }
};

const generateOverrideforAuthResource = async (context: $TSContext, resourceName: string, resourceType: string) => {
  const backendDir = pathManager.getBackendDirPath();
  const destPath = path.normalize(path.join(backendDir, category, resourceName));
  const srcPath = path.normalize(path.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource', resourceType));

  await generateOverrideSkeleton(context, srcPath, destPath);
};
