import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addAuthUserPoolOnly,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...b', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project with only user pool and no identity pool', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthUserPoolOnly(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map((key) => meta.auth[key])[1].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);

    expect(userPool.UserPool).toBeDefined();
    const { userPoolGroups } = meta.auth;
    expect(userPoolGroups.service).toEqual('Cognito-UserPool-Groups');
    expect(userPoolGroups.providerPlugin).toEqual('awscloudformation');
    expect(userPoolGroups.dependsOn.length).toBe(1);
    expect(userPoolGroups.dependsOn[0].category).toBe('auth');
    expect(userPoolGroups.dependsOn[0].attributes.length).toBe(3);
    expect(userPoolGroups.dependsOn[0].attributes).toContain('UserPoolId');
    expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientIDWeb');
    expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientID');
  });
});
