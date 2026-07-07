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
  getMFAConfiguration,
} from '@aws-amplify/amplify-e2e-core';
import {
  // eslint-disable-next-line spellcheck/spell-checker
  CognitoUserPoolSigninMethod,
  CognitoUserProperty,
} from 'amplify-headless-interface';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};

describe('headless auth d', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adds auth resource with TOTP only but enables SMS through password recovery', async () => {
    // AddAuthRequest v1
    const addAuthRequest: any = {
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL],
          passwordRecovery: {
            deliveryMethod: 'SMS',
            smsMessage: 'The verification code is {####}',
          },
          // eslint-disable-next-line spellcheck/spell-checker
          signinMethod: CognitoUserPoolSigninMethod.PHONE_NUMBER,
          mfa: {
            mode: 'OPTIONAL',
            mfaTypes: ['TOTP'],
            smsMessage: 'The verification code is {####}',
          },
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const mfaConfig = await getMFAConfiguration(id, region);
    expect(mfaConfig.SoftwareTokenMfaConfiguration.Enabled).toBeTruthy();
    expect(mfaConfig.SmsMfaConfiguration.SmsConfiguration).toBeDefined();
    expect(userPool.UserPool).toBeDefined();
    expect(userPool.UserPool.UserAttributeUpdateSettings).toMatchInlineSnapshot(`
      {
        "AttributesRequireVerificationBeforeUpdate": [
          "phone_number",
        ],
      }
    `);
  });
});
