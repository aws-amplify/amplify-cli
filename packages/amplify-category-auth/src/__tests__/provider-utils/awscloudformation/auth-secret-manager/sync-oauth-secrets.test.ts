/* eslint-disable max-lines-per-function */
import { $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { mocked } from 'ts-jest';
import path from 'path';
import { syncOAuthSecretsToCloud } from '../../../../provider-utils/awscloudformation/auth-secret-manager/sync-oauth-secrets';
import { OAuthSecretsStateManager } from '../../../../provider-utils/awscloudformation/auth-secret-manager/auth-secret-manager';
import { getAppId } from '../../../../provider-utils/awscloudformation/utils/get-app-id';
import { getOAuthObjectFromCognito } from '../../../../provider-utils/awscloudformation/utils/get-oauth-secrets-from-cognito';

jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/auth-secret-manager/auth-secret-manager');
jest.mock('../../../../provider-utils/awscloudformation/utils/get-app-id');
jest.mock('../../../../provider-utils/awscloudformation/utils/get-oauth-secrets-from-cognito');

const stateManagerMock = mocked(stateManager);
const pathManagerMock = mocked(pathManager);
const getOAuthObjectFromCognitoMock = mocked(getOAuthObjectFromCognito);
const getAppIdMock = mocked(getAppId);
const OAuthSecretsStateManagerMock = mocked(OAuthSecretsStateManager);

getAppIdMock.mockReturnValue('amplifyAppId');
getOAuthObjectFromCognitoMock.mockResolvedValue('secretValue');

stateManagerMock.getLocalEnvInfo.mockReturnValue({
  envName: 'test',
});
stateManagerMock.getTeamProviderInfo.mockReturnValue({});

stateManagerMock.getResourceParametersJson.mockReturnValue({
  hostedUI: true,
  authProvidersUserPool: ['mockProvider'],
});

pathManagerMock.getBackendDirPath.mockReturnValue(path.join('test', 'path'));

const setOAuthSecretsMock = jest.fn();
const getOAuthSecretsMock = jest.fn();
OAuthSecretsStateManagerMock.getInstance.mockResolvedValue(({
  setOAuthSecrets: setOAuthSecretsMock,
  getOAuthSecrets: getOAuthSecretsMock,
} as unknown) as OAuthSecretsStateManager);

const inputPayload1 = {
  cognitoConfig: {
    identityPoolName: 'mockIdentityPool',
    allowUnauthenticatedIdentities: true,
    resourceNameTruncated: 'auth',
    userPoolName: 'mockUserPool',
    autoVerifiedAttributes: ['email'],
    mfaConfiguration: 'ON',
    mfaTypes: ['SMS Text Message', 'TOTP'],
    smsAuthenticationMessage: 'Your authentication code is {####}',
    smsVerificationMessage: 'Your verification code is {####}',
    emailVerificationSubject: 'Your verification code',
    emailVerificationMessage: 'Your verification code is {####}',
    defaultPasswordPolicy: true,
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: ['Requires Lowercase', 'Requires Uppercase', 'Requires Numbers', 'Requires Symbols'],
    requiredAttributes: [
      'address',
      'email',
      'family_name',
      'middle_name',
      'gender',
      'locale',
      'given_name',
      'name',
      'nickname',
      'phone_number',
      'preferred_username',
      'picture',
      'profile',
      'updated_at',
      'website',
    ],
    userpoolClientGenerateSecret: false,
    userpoolClientRefreshTokenValidity: 30,
    userpoolClientWriteAttributes: ['address', 'email'],
    userpoolClientReadAttributes: ['address', 'email'],
    userpoolClientLambdaRole: 'extaut87063394_userpoolclient_lambda_role',
    userpoolClientSetAttributes: true,
    sharedId: '87063394',
    resourceName: 'extauth38706339487063394',
    authSelections: 'identityPoolAndUserPool',
    authRoleArn: {
      'Fn::GetAtt': ['AuthRole', 'Arn'],
    },
    unauthRoleArn: {
      'Fn::GetAtt': ['UnauthRole', 'Arn'],
    },
    useDefault: 'manual',
    thirdPartyAuth: true,
    authProviders: ['graph.facebook.com', 'accounts.google.com', 'www.amazon.com', 'appleid.apple.com'],
    facebookAppId: 'dfvsdcsdc',
    googleClientId: 'svsdvsv',
    amazonAppId: 'sdsafggas',
    appleAppId: 'gfdbvafergew',
    userPoolGroups: true,
    adminQueries: false,
    triggers: {
      CreateAuthChallenge: ['captcha-create-challenge'],
      CustomMessage: ['verification-link'],
      DefineAuthChallenge: ['captcha-define-challenge'],
      PostAuthentication: ['custom'],
      PostConfirmation: ['add-to-group'],
      PreAuthentication: ['custom'],
      PreSignup: ['email-filter-allowlist'],
      VerifyAuthChallengeResponse: ['captcha-verify'],
      PreTokenGeneration: ['alter-claims'],
    },
    hostedUI: true,
    hostedUIDomainName: 'extauth387063394-87063394',
    newCallbackURLs: ['https://localhost:3000/'],
    newLogoutURLs: ['https://localhost:3000/'],
    AllowedOAuthFlows: 'code',
    AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
    authProvidersUserPool: ['Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'],
    selectedParties:
      '{"graph.facebook.com":"dfvsdcsdc","accounts.google.com":"svsdvsv","www.amazon.com":"sdsafggas","appleid.apple.com":"gfdbvafergew"}',
    hostedUIProviderMeta:
      '[{"ProviderName":"Facebook","authorize_scopes":"email,public_profile","AttributeMapping":{"email":"email","username":"id"}},{"ProviderName":"Google","authorize_scopes":"openid email profile","AttributeMapping":{"email":"email","username":"sub"}},{"ProviderName":"LoginWithAmazon","authorize_scopes":"profile profile:user_id","AttributeMapping":{"email":"email","username":"user_id"}},{"ProviderName":"SignInWithApple","authorize_scopes":"email","AttributeMapping":{"email":"email"}}]',
    oAuthMetadata:
      '{"AllowedOAuthFlows":["code"],"AllowedOAuthScopes":["phone","email","openid","profile","aws.cognito.signin.user.admin"],"CallbackURLs":["https://localhost:3000/"],"LogoutURLs":["https://localhost:3000/"]}',
    serviceName: 'Cognito',
    verificationBucketName: 'extauth38706339487063394verificationbucket',
    usernameCaseSensitive: false,
  },
};

const getCLIInputPayloadMock = jest.fn().mockReturnValue(inputPayload1);

const cliInputFileExistsMock = jest.fn().mockReturnValue('true');

jest.mock('../../../../provider-utils/awscloudformation/auth-secret-manager/secret-name', () => ({
  ...(jest.requireActual('../../../../provider-utils/awscloudformation/auth-secret-manager/secret-name') as {}),
  getAppId: jest.fn().mockReturnValue('mockAmplifyAppId'),
}));

jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state.ts', () => ({
  AuthInputState: jest.fn().mockImplementation(() => ({
    getCLIInputPayload: getCLIInputPayloadMock,
    cliInputFileExists: cliInputFileExistsMock,
  })),
}));

const getImportedAuthPropertiesMock = jest.fn().mockReturnValue({ imported: false });

const contextStub = {
  amplify: {
    getImportedAuthProperties: getImportedAuthPropertiesMock,
  },
  print: {
    error: jest.fn(),
  },
};

const contextStubTyped = (contextStub as unknown) as $TSContext;
describe('sync oAuth Secrets', () => {
  it('set oauth in cloud and tpi file', async () => {
    const oauthObjSecret = {
      hostedUIProviderCreds:
        // eslint-disable-next-line spellcheck/spell-checker
        '[{"ProviderName":"Facebook","client_id":"sdcsdc","client_secret":"bfdsvsr"},{"ProviderName":"Google","client_id":"avearver","client_secret":"vcvereger"},{"ProviderName":"LoginWithAmazon","client_id":"vercvdsavcer","client_secret":"revfdsavrtv"},{"ProviderName":"SignInWithApple","client_id":"vfdvergver","team_id":"ervervre","key_id":"vfdavervfer","private_key":"vaveb"}]',
    };
    const resourceName = 'mockResource';
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName, oauthObjSecret)).toMatchInlineSnapshot(
      // eslint-disable-next-line spellcheck/spell-checker
      '"[{\\"ProviderName\\":\\"Facebook\\",\\"client_id\\":\\"sdcsdc\\",\\"client_secret\\":\\"bfdsvsr\\"},{\\"ProviderName\\":\\"Google\\",\\"client_id\\":\\"avearver\\",\\"client_secret\\":\\"vcvereger\\"},{\\"ProviderName\\":\\"LoginWithAmazon\\",\\"client_id\\":\\"vercvdsavcer\\",\\"client_secret\\":\\"revfdsavrtv\\"},{\\"ProviderName\\":\\"SignInWithApple\\",\\"client_id\\":\\"vfdvergver\\",\\"team_id\\":\\"ervervre\\",\\"key_id\\":\\"vfdavervfer\\",\\"private_key\\":\\"vaveb\\"}]"',
    );
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "test": Object {
          "categories": Object {
            "auth": Object {
              "mockResource": Object {
                "oAuthSecretsPathAmplifyAppId": "amplifyAppId",
              },
            },
          },
        },
      }
    `);
    expect(setOAuthSecretsMock.mock.calls[0][0]).toMatchInlineSnapshot(
      // eslint-disable-next-line spellcheck/spell-checker
      '"[{\\"ProviderName\\":\\"Facebook\\",\\"client_id\\":\\"sdcsdc\\",\\"client_secret\\":\\"bfdsvsr\\"},{\\"ProviderName\\":\\"Google\\",\\"client_id\\":\\"avearver\\",\\"client_secret\\":\\"vcvereger\\"},{\\"ProviderName\\":\\"LoginWithAmazon\\",\\"client_id\\":\\"vercvdsavcer\\",\\"client_secret\\":\\"revfdsavrtv\\"},{\\"ProviderName\\":\\"SignInWithApple\\",\\"client_id\\":\\"vfdvergver\\",\\"team_id\\":\\"ervervre\\",\\"key_id\\":\\"vfdavervfer\\",\\"private_key\\":\\"vaveb\\"}]"',
    );
  });

  it('update secret from parameter store', async () => {
    const resourceName = 'mockResource';
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName)).toMatchInlineSnapshot('"secretValue"');
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "test": Object {
          "categories": Object {
            "auth": Object {
              "mockResource": Object {
                "oAuthSecretsPathAmplifyAppId": "amplifyAppId",
              },
            },
          },
        },
      }
    `);
  });

  it('update secret from cognito if not present in parameter store', async () => {
    const resourceName = 'mockResource';
    getOAuthSecretsMock.mockReset();
    getOAuthSecretsMock.mockResolvedValue(undefined);
    stateManagerMock.getTeamProviderInfo.mockReset();
    stateManagerMock.getTeamProviderInfo.mockReturnValue({
      categories: {
        auth: {
          mockAuthResource: {
            hostedUIProviderCreds: '[]',
          },
        },
      },
    });
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName)).toMatchInlineSnapshot('"secretValue"');
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "test": Object {
          "categories": Object {
            "auth": Object {
              "mockResource": Object {
                "oAuthSecretsPathAmplifyAppId": "amplifyAppId",
              },
            },
          },
        },
      }
    `);
  });

  it('removes appId if no userPool providers present', async () => {
    const resourceName = 'mockResource';
    getCLIInputPayloadMock.mockReset();
    getCLIInputPayloadMock.mockReturnValue({
      cognitoConfig: {
        ...inputPayload1.cognitoConfig,
        authProvidersUserPool: [],
        hostedUI: false,
      },
    });
    stateManagerMock.getTeamProviderInfo.mockReset();
    stateManagerMock.getTeamProviderInfo.mockReturnValue({});
    stateManagerMock.setTeamProviderInfo.mockReset();
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName)).toMatchInlineSnapshot('undefined');
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot('Object {}');
  });

  it('returns undefined if the auth is imported', async () => {
    const oauthObjSecret = {};
    const resourceName = 'mockResource';
    getImportedAuthPropertiesMock.mockReset();
    getImportedAuthPropertiesMock.mockReturnValue({ imported: true });
    stateManagerMock.setTeamProviderInfo.mockReset();
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName, oauthObjSecret)).toMatchInlineSnapshot('undefined');
    expect(stateManagerMock.setTeamProviderInfo).not.toBeCalled();
  });

  it('returns undefined if auth is not migrated', async () => {
    const oauthObjSecret = {};
    const resourceName = 'mockResource';
    getImportedAuthPropertiesMock.mockReset();
    getImportedAuthPropertiesMock.mockReturnValue({ imported: false });
    cliInputFileExistsMock.mockReset();
    cliInputFileExistsMock.mockReturnValue(false);
    stateManagerMock.getTeamProviderInfo.mockReset();
    stateManagerMock.getTeamProviderInfo.mockReturnValue({});
    expect(await syncOAuthSecretsToCloud(contextStubTyped, resourceName, oauthObjSecret)).toMatchInlineSnapshot('undefined');
    expect(stateManagerMock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "test": Object {
          "categories": Object {
            "auth": Object {
              "mockResource": Object {
                "hostedUIProviderCreds": "[]",
              },
            },
          },
        },
      }
    `);
  });
});
