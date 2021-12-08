import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addHeadlessAuth,
  updateHeadlessAuth,
  removeHeadlessAuth,
  getCloudBackendConfig,
  headlessAuthImport,
} from 'amplify-e2e-core';
import { addAuthWithDefault, getBackendAmplifyMeta } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool, getMFAConfiguration } from 'amplify-e2e-core';
import {
  AddAuthRequest,
  CognitoUserPoolSigninMethod,
  CognitoPasswordRecoveryConfiguration,
  CognitoUserProperty,
  ImportAuthRequest,
  UpdateAuthRequest,
} from 'amplify-headless-interface';
import _ from 'lodash';
import {
  expectAuthProjectDetailsMatch,
  expectLocalAndCloudMetaFilesMatching,
  expectLocalTeamInfoHasNoCategories,
  expectNoAuthInMeta,
  getAuthProjectDetails,
  removeImportedAuthWithDefault,
  setupOgProjectWithAuth,
} from '../import-helpers';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};

describe('headless auth', () => {
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
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
          signinMethod: CognitoUserPoolSigninMethod.USERNAME,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });
  it('adds auth resource with TOTP only', async () => {
    const addAuthRequest: AddAuthRequest = {
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL],
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
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const mfaconfig = await getMFAConfiguration(id, region);
    expect(mfaconfig.SoftwareTokenMfaConfiguration.Enabled).toBeTruthy();
    /** expected : undefined
     * need to debug
     *  Received: {"SmsAuthenticationMessage": "The verification code is {####}", "SmsConfiguration": {"ExternalId": "authte3404c1bd_role_external_id", "SnsCallerArn": "arn:aws:iam::136981144547:role/sns3404c1bd132643-integtest"}}
     */
    expect(mfaconfig.SmsMfaConfiguration).toBeDefined();
    expect(mfaconfig.SmsMfaConfiguration.SmsAuthenticationMessage).toBe('The verification code is {####}');
    expect(userPool.UserPool).toBeDefined();
  });

  it('adds auth resource with TOTP only but enable SMS through signUp Attributes', async () => {
    const addAuthRequest: AddAuthRequest = {
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
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
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const mfaconfig = await getMFAConfiguration(id, region);
    expect(mfaconfig.SoftwareTokenMfaConfiguration.Enabled).toBeTruthy();
    expect(mfaconfig.SmsMfaConfiguration.SmsConfiguration).toBeDefined();
    expect(userPool.UserPool).toBeDefined();
  });

  it('adds auth resource with TOTP only but enables SMS through password recovery', async () => {
    const addAuthRequest: AddAuthRequest = {
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
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const region = meta.providers.awscloudformation.Region;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    const mfaconfig = await getMFAConfiguration(id, region);
    expect(mfaconfig.SoftwareTokenMfaConfiguration.Enabled).toBeTruthy();
    expect(mfaconfig.SmsMfaConfiguration.SmsConfiguration).toBeDefined();
    expect(userPool.UserPool).toBeDefined();
  });

  it('updates existing auth resource', async () => {
    const updateAuthRequest: UpdateAuthRequest = {
      version: 1,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          unauthenticatedLogin: true,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await updateHeadlessAuth(projRoot, updateAuthRequest, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(_.get(meta, ['auth', 'userPoolGroups'])).toBeDefined();
  });

  it('removes auth resource', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const { auth: authBefore } = getBackendAmplifyMeta(projRoot);
    const authResourceName = _.keys(authBefore).find(() => true); // first element or undefined
    expect(authResourceName).toBeDefined();
    const { auth: authBackendConfigBefore } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigBefore)).toBe(false);
    await removeHeadlessAuth(projRoot, authResourceName);
    await amplifyPushAuth(projRoot);
    const { auth: authAfter } = getBackendAmplifyMeta(projRoot);
    expect(_.isEmpty(authAfter)).toBe(true);
    const { auth: authBackendConfigAfter } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigAfter)).toBe(true);
  });
});
