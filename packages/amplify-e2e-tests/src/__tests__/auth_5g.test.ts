/* eslint-disable import/no-extraneous-dependencies */
import {
  assertAppClientSecretInFiles,
  deleteProject,
  amplifyPushNonInteractive,
  addHeadlessAuth,
  createNewProjectDir,
  deleteProjectDir,
  initAndroidProjectWithProfile,
  updateCLIParametersToGenerateUserPoolClientSecret,
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

describe('headless auth g', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adds auth resource to android project', async () => {
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

    await initAndroidProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);

    updateCLIParametersToGenerateUserPoolClientSecret(projRoot, addAuthRequest.resourceName);

    await amplifyPushNonInteractive(projRoot);

    await assertAppClientSecretInFiles(projRoot, 'android');
  });
});
