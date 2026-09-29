import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { updateConfigOnEnvInit } from '../../../provider-utils/awscloudformation/index';
import { getOAuthObjectFromCognito } from '../../../provider-utils/awscloudformation/utils/get-oauth-secrets-from-cognito';

jest.mock('@aws-amplify/amplify-environment-parameters');
jest.mock('../../../provider-utils/awscloudformation/utils/get-oauth-secrets-from-cognito');
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
    stringify: jest.fn().mockImplementation(JSON.stringify),
    parse: jest.fn().mockImplementation(JSON.parse),
  },
  FeatureFlags: {
    getBoolean: jest.fn().mockReturnValue(true),
  },
}));
// mock fns
const pluginInstanceMock = jest.fn();
const loadResourceParametersMock = jest.fn().mockReturnValue({
  thirdPartyAuth: true, // enable third party auth, but do not include any authProviders. Should not fail.
  hostedUIProviderMeta: JSON.stringify([
    {
      ProviderName: 'Facebook',
      authorize_scopes: 'email,public_profile',
      AttributeMapping: {
        email: 'email',
        username: 'id',
      },
    },
    {
      ProviderName: 'LoginWithAmazon',
      authorize_scopes: 'profile profile:user_id',
      AttributeMapping: {
        email: 'email',
        username: 'user_id',
      },
    },
    {
      ProviderName: 'Google',
      authorize_scopes: 'openid email profile',
      AttributeMapping: {
        email: 'email',
        username: 'sub',
      },
    },
    {
      ProviderName: 'SignInWithApple',
      authorize_scopes: 'openid email profile',
      AttributeMapping: {
        email: 'email',
        username: 'sub',
      },
    },
  ]),
});
const pluginInstance = {
  loadResourceParameters: loadResourceParametersMock,
};

const getOAuthObjectFromCognitoMock = getOAuthObjectFromCognito as jest.MockedFunction<typeof getOAuthObjectFromCognito>;

// mock context
const mockContext = {
  amplify: {
    getProjectConfig: jest.fn().mockReturnValue({
      projectName: 'authHeadless',
      version: '3.1',
      frontend: 'javascript',
      javascript: {
        framework: 'none',
        config: {
          SourceDir: 'src',
          DistributionDir: 'dist',
          BuildCommand: 'npm run-script build',
          StartCommand: 'npm run-script start',
        },
      },
      providers: ['awscloudformation'],
    }),
    getProjectDetails: jest.fn(),
    updateamplifyMetaAfterResourceAdd: jest.fn(),
    getPluginInstance: pluginInstanceMock.mockReturnValue(pluginInstance),
    saveEnvResourceParameters: jest.fn(),
    loadEnvResourceParameters: jest.fn().mockReturnValue({}),
  },
  parameters: {
    first: 'mockFirst',
  },
  input: {
    command: 'import',
  },
  exeInfo: {
    inputParams: {
      yes: true,
    },
  },
} as unknown as $TSContext;

describe('import checks', () => {
  test('throws amplify error when auth headless params are missing during pull', async () => {
    await expect(() => updateConfigOnEnvInit(mockContext, 'auth', 'Cognito')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"auth headless is missing the following inputParameters facebookAppIdUserPool, facebookAppSecretUserPool, loginwithamazonAppIdUserPool, loginwithamazonAppSecretUserPool, googleAppIdUserPool, googleAppSecretUserPool"`,
    );
  });
});

describe('update config when amplify pull headless command', () => {
  test('throws amplify error when auth headless params are missing during pull', async () => {
    mockContext.input.command = 'pull';
    getOAuthObjectFromCognitoMock.mockResolvedValue(undefined);
    await expect(() => updateConfigOnEnvInit(mockContext, 'auth', 'Cognito')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"auth headless is missing the following inputParameters facebookAppIdUserPool, facebookAppSecretUserPool, loginwithamazonAppIdUserPool, loginwithamazonAppSecretUserPool, googleAppIdUserPool, googleAppSecretUserPool"`,
    );
  });

  test('works when secrets are fetched from userpool', async () => {
    mockContext.input.command = 'pull';
    getOAuthObjectFromCognitoMock.mockResolvedValue([
      {
        client_id: 'mockClientFacebook',
        client_secret: 'mockSecretFacebook',
        ProviderName: 'Facebook',
      },
      {
        client_id: 'mockClientGoogle',
        client_secret: 'mockSecretGoogle',
        ProviderName: 'Google',
      },
      {
        client_id: 'mockClientLoginWithAmazon',
        client_secret: 'mockSecretLoginWithAmazon',
        ProviderName: 'LoginWithAmazon',
      },
      {
        client_id: 'mockClientSignInWithApple',
        team_id: 'mockTeamIdSignInWithApple',
        key_id: 'mockKeyIdSignInWithApple',
        private_key: 'mockPrivayKeySignInWithApple',
        ProviderName: 'SignInWithApple',
      },
    ]);
    const params = await updateConfigOnEnvInit(mockContext, 'auth', 'Cognito');
    expect(params).toMatchInlineSnapshot(`
      {
        "hostedUIProviderCreds": "[{"ProviderName":"Facebook"},{"ProviderName":"LoginWithAmazon"},{"ProviderName":"Google"},{"ProviderName":"SignInWithApple"}]",
      }
    `);
  });

  test('works when secrets are present in deployment params', async () => {
    mockContext.input.command = 'pull';
    getOAuthObjectFromCognitoMock.mockResolvedValue(undefined);
    mockContext.amplify.loadEnvResourceParameters = jest.fn().mockReturnValue({
      hostedUIProviderCreds:
        '[{"ProviderName":"Facebook","client_id":"sdcsdc","client_secret":"bfdsvsr"},{"ProviderName":"Google","client_id":"avearver","client_secret":"vcvereger"},{"ProviderName":"LoginWithAmazon","client_id":"vercvdsavcer","client_secret":"revfdsavrtv"},{"ProviderName":"SignInWithApple","client_id":"vfdvergver","team_id":"ervervre","key_id":"vfdavervfer","private_key":"vaveb"}]',
    });
    const params = await updateConfigOnEnvInit(mockContext, 'auth', 'Cognito');
    expect(params).toMatchInlineSnapshot(`
      {
        "hostedUIProviderCreds": "[{"ProviderName":"Facebook"},{"ProviderName":"LoginWithAmazon"},{"ProviderName":"Google"},{"ProviderName":"SignInWithApple"}]",
      }
    `);
  });

  test('test works when secrets are present in context input params', async () => {
    mockContext.input.command = 'pull';
    getOAuthObjectFromCognitoMock.mockResolvedValue(undefined);
    mockContext.amplify.loadEnvResourceParameters = jest.fn().mockReturnValue('[]');
    mockContext.exeInfo = {
      inputParams: {
        yes: true,
        categories: {
          auth: {
            facebookAppIdUserPool: 'mockfacebookAppIdUserPool',
            facebookAppSecretUserPool: 'facebookAppSecretUserPool',
            googleAppIdUserPool: 'googleAppIdUserPool',
            googleAppSecretUserPool: 'googleAppSecretUserPool',
            loginwithamazonAppIdUserPool: 'loginwithamazonAppIdUserPool',
            loginwithamazonAppSecretUserPool: 'loginwithamazonAppSecretUserPool',
            signinwithappleClientIdUserPool: 'signinwithappleClientIdUserPool',
            signinwithappleTeamIdUserPool: 'signinwithappleTeamIdUserPool',
            signinwithappleKeyIdUserPool: 'signinwithappleKeyIdUserPool',
            signinwithapplePrivateKeyUserPool: 'signinwithapplePrivateKeyUserPool',
          },
        },
      },
      localEnvInfo: {
        projectPath: 'mockProjectPath',
        defaultEditor: 'vscode',
        envName: 'dev',
        noUpdateBackend: false,
      },
    };
    const params = await updateConfigOnEnvInit(mockContext, 'auth', 'Cognito');
    expect(params).toMatchInlineSnapshot(`
      {
        "hostedUIProviderCreds": "[{"ProviderName":"Facebook","client_id":"mockfacebookAppIdUserPool","client_secret":"facebookAppSecretUserPool"},{"ProviderName":"LoginWithAmazon","client_id":"loginwithamazonAppIdUserPool","client_secret":"loginwithamazonAppSecretUserPool"},{"ProviderName":"Google","client_id":"googleAppIdUserPool","client_secret":"googleAppSecretUserPool"},{"ProviderName":"SignInWithApple","client_id":"signinwithappleClientIdUserPool","team_id":"signinwithappleTeamIdUserPool","key_id":"signinwithappleKeyIdUserPool","private_key":"signinwithapplePrivateKeyUserPool"}]",
      }
    `);
  });
});
