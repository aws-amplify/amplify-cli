/* eslint-disable import/no-extraneous-dependencies */
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addHeadlessAuth,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
} from '@aws-amplify/amplify-e2e-core';
import {
  // eslint-disable-next-line spellcheck/spell-checker
  AddAuthRequest,
  CognitoUserPoolSigninMethod,
  CognitoUserProperty,
} from 'amplify-headless-interface';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};

describe('headless auth a', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('adds auth resource', async () => {
    const addAuthRequest: AddAuthRequest = {
      version: 2,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
          // eslint-disable-next-line spellcheck/spell-checker
          signinMethod: CognitoUserPoolSigninMethod.USERNAME,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });
});
