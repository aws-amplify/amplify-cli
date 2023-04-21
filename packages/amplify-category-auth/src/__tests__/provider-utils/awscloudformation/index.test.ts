import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { updateConfigOnEnvInit } from '../../../provider-utils/awscloudformation/index';

jest.mock('@aws-amplify/amplify-environment-parameters');
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
  hostedUIProviderMeta:
    '[{"ProviderName":"Facebook","authorize_scopes":"email,public_profile","AttributeMapping":{"email":"email","username":"id"}},{"ProviderName":"LoginWithAmazon","authorize_scopes":"profile profile:user_id","AttributeMapping":{"email":"email","username":"user_id"}},{"ProviderName":"Google","authorize_scopes":"openid email profile","AttributeMapping":{"email":"email","username":"sub"}}]',
});
const pluginInstance = {
  loadResourceParameters: loadResourceParametersMock,
};

// mock context
let mockContext = {
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

test('throws amplify error when auth headless params are missing during pull', async () => {
  expect(() => updateConfigOnEnvInit(mockContext, 'auth', 'Cognito')).rejects.toThrowErrorMatchingInlineSnapshot(
    `"auth headless is missing the following inputParameters facebookAppIdUserPool, facebookAppSecretUserPool, loginwithamazonAppIdUserPool, loginwithamazonAppSecretUserPool, googleAppIdUserPool, googleAppSecretUserPool"`,
  );
});
