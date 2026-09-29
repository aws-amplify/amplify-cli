import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addAuthWithDefault,
  removeAuthWithDefault,
  getBackendAmplifyMeta,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...a', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init a project and add auth with defaults and push, then remove auth and push should clean up trust relationship conditions', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);

    const amplifyMeta = getBackendAmplifyMeta(projRoot);
    const { AuthRoleName, UnauthRoleName } = amplifyMeta.providers.awscloudformation;
    const cognitoResource = Object.values(amplifyMeta.auth).find((res: any) => res.service === 'Cognito') as any;
    const idpId = cognitoResource.output.IdentityPoolId;

    expect(AuthRoleName).toHaveValidPolicyConditionMatchingIdpId(idpId);
    expect(UnauthRoleName).toHaveValidPolicyConditionMatchingIdpId(idpId);

    await removeAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);

    expect(AuthRoleName).toHaveDenyAssumeRolePolicy();
    expect(UnauthRoleName).toHaveDenyAssumeRolePolicy();
  });
});
