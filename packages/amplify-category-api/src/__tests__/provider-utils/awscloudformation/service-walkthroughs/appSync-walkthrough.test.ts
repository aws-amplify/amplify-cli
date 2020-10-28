import {
  getIAMPolicies,
  askAdditionalAuthQuestions,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import { authConfigHasApiKey, getAppSyncAuthConfig } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-utils';
jest.mock('../../../../provider-utils/awscloudformation/utils/amplify-meta-utils', () => ({
  getAppSyncAuthConfig: jest.fn(),
  authConfigHasApiKey: jest.fn(),
}));

const authConfigHasApiKey_mock = authConfigHasApiKey as jest.MockedFunction<typeof authConfigHasApiKey>;
const getAppSyncAuthConfig_mock = getAppSyncAuthConfig as jest.MockedFunction<typeof getAppSyncAuthConfig>;
const confirmPromptFalse_mock = jest.fn(() => false);

const context_stub = (prompt: jest.Mock) => ({
  prompt: {
    confirm: prompt,
  },
  amplify: {
    getProjectMeta: jest.fn(),
  },
});

describe('get IAM policies', () => {
  it('does not include API key if none exists', () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => false);
    const { attributes } = getIAMPolicies('testResourceName', ['read'], context_stub(confirmPromptFalse_mock));
    expect(attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
      ]
    `);
  });

  it('includes API key if it exists', () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => true);
    const { attributes } = getIAMPolicies('testResourceName', ['read'], context_stub(confirmPromptFalse_mock));
    expect(attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
        "GraphQLAPIKeyOutput",
      ]
    `);
  });
});

describe('correct Auth Config', () => {
  it('dont configure additional auth types ', async () => {
    const authConfig_mock = {
      defaultAuthentication: {
        authenticationType: 'AWS_IAM',
      },
      additionalAuthenticationProviders: [],
    };
    const defaultAuthType_mock = 'AWS_IAM';

    const currentAuthConfig = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        {
          authenticationType: 'AWS_IAM',
        },
      ],
    };
    getAppSyncAuthConfig_mock.mockImplementationOnce(() => currentAuthConfig);
    const authConfig = await askAdditionalAuthQuestions(context_stub(confirmPromptFalse_mock), authConfig_mock, defaultAuthType_mock);
    expect(authConfig).toMatchSnapshot();
  });
});
