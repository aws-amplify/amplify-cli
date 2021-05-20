import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getPermissionsBoundary,
  getProjectMeta,
  initJSProjectWithProfile,
  initWithPermissionsBoundary,
} from 'amplify-e2e-core';
import { updateEnvironment } from '../environment/env';

// Using a random AWS managed policy as a permissions boundary
const permissionsBoundaryArn = 'arn:aws:iam::aws:policy/AlexaForBusinessFullAccess';

describe('iam permissions boundary', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('perm-bound');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  test('permissions boundary is applied to roles created by the CLI', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await updateEnvironment(projRoot, { permissionsBoundaryArn });
    // adding a function isn't strictly part of the test, it just causes the project to have changes to push
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const authRoleName = meta?.providers?.awscloudformation?.AuthRoleName;
    const region = meta?.providers?.awscloudformation?.Region;

    const actualPermBoundary = await getPermissionsBoundary(authRoleName, region);
    expect(actualPermBoundary).toEqual(permissionsBoundaryArn);
  });

  test('permissions boundary is applied during headless init', async () => {
    await initWithPermissionsBoundary(projRoot, permissionsBoundaryArn);
    const meta = getProjectMeta(projRoot);
    const authRoleName = meta?.providers?.awscloudformation?.AuthRoleName;
    const region = meta?.providers?.awscloudformation?.Region;

    const actualPermBoundary = await getPermissionsBoundary(authRoleName, region);
    expect(actualPermBoundary).toEqual(permissionsBoundaryArn);
  });
});
