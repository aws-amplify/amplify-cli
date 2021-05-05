import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getPermissionBoundary,
  getProjectMeta,
  initJSProjectWithProfile,
  initWithPermissionBoundary,
} from 'amplify-e2e-core';
import { updateEnvironment } from '../environment/env';

// Using a random AWS managed policy as a permission boundary
const permissionBoundaryArn = 'arn:aws:iam::aws:policy/AlexaForBusinessFullAccess';

describe('iam permission boundary', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('perm-bound');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  test('permission boundary is applied to roles created by the CLI', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await updateEnvironment(projRoot, { permissionBoundaryArn });
    // adding a function isn't strictly part of the test, it just causes the project to have changes to push
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const authRoleName = meta?.providers?.awscloudformation?.AuthRoleName;
    const region = meta?.providers?.awscloudformation?.Region;

    const actualPermBoundary = await getPermissionBoundary(authRoleName, region);
    expect(actualPermBoundary).toEqual(permissionBoundaryArn);
  });

  test('permission boundary is applied during headless init', async () => {
    await initWithPermissionBoundary(projRoot, permissionBoundaryArn);
    const meta = getProjectMeta(projRoot);
    const authRoleName = meta?.providers?.awscloudformation?.AuthRoleName;
    const region = meta?.providers?.awscloudformation?.Region;

    const actualPermBoundary = await getPermissionBoundary(authRoleName, region);
    expect(actualPermBoundary).toEqual(permissionBoundaryArn);
  });
});
