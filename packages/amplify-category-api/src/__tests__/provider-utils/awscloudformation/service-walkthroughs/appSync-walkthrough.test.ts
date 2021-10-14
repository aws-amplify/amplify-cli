import { $TSAny, $TSContext, FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import {
  askAdditionalAuthQuestions,
  getIAMPolicies,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import { authConfigHasApiKey, getAppSyncAuthConfig } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-utils';

jest.mock('../../../../provider-utils/awscloudformation/utils/amplify-meta-utils', () => ({
  getAppSyncAuthConfig: jest.fn(),
  authConfigHasApiKey: jest.fn(),
}));
jest.mock('amplify-cli-core');
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta = jest.fn();

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
pathManager_mock.getResourceDirectoryPath = jest.fn().mockReturnValue('mocked/resource/path');

const mockGetBoolean = FeatureFlags.getBoolean as jest.Mock;

const authConfigHasApiKey_mock = authConfigHasApiKey as jest.MockedFunction<typeof authConfigHasApiKey>;
const getAppSyncAuthConfig_mock = getAppSyncAuthConfig as jest.MockedFunction<typeof getAppSyncAuthConfig>;
const confirmPromptFalse_mock = jest.fn(() => false);

const context_stub = (prompt: jest.Mock) =>
  ({
    prompt: {
      confirm: prompt,
    },
    amplify: {
      getProjectMeta: jest.fn(),
    },
  } as unknown as $TSContext);

type IAMArtifact = {
  attributes: string[];
  policy: $TSAny;
};

describe('get IAM policies', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('does not include API key if none exists', async () => {
    mockGetBoolean.mockImplementationOnce(() => true);
    authConfigHasApiKey_mock.mockImplementationOnce(() => false);
    const iamArtifact: IAMArtifact = getIAMPolicies('testResourceName', ['Query']);
    expect(iamArtifact.attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
      ]
    `);
    expect(iamArtifact.policy.Resource[0]['Fn::Join'][1][6]).toMatch('/types/Query/*');
  });

  it('includes API key if it exists', async () => {
    mockGetBoolean.mockImplementationOnce(() => true);
    authConfigHasApiKey_mock.mockImplementationOnce(() => true);
    const iamArtifact: IAMArtifact = getIAMPolicies('testResourceName', ['Query']);
    expect(iamArtifact.attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
        "GraphQLAPIKeyOutput",
      ]
    `);
    expect(iamArtifact.policy.Resource[0]['Fn::Join'][1][6]).toMatch('/types/Query/*');
  });

  it('policy path includes the new format for graphql operations', async () => {
    mockGetBoolean.mockImplementationOnce(() => true);
    authConfigHasApiKey_mock.mockImplementationOnce(() => false);
    const iamArtifact: IAMArtifact = getIAMPolicies('testResourceName', ['Query', 'Mutate']);
    expect(iamArtifact.attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
      ]
    `);
    expect(iamArtifact.policy.Resource[0]['Fn::Join'][1][6]).toMatch('/types/Query/*');
    expect(iamArtifact.policy.Resource[1]['Fn::Join'][1][6]).toMatch('/types/Mutate/*');
  });

  it('policy path includes the old format for appsync api operations', async () => {
    mockGetBoolean.mockImplementationOnce(() => false);
    authConfigHasApiKey_mock.mockImplementationOnce(() => false);
    const iamArtifact: IAMArtifact = getIAMPolicies('testResourceName', ['create', 'update']);
    expect(iamArtifact.attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
      ]
    `);
    expect(iamArtifact.policy.Action).toHaveLength(4);
    expect(iamArtifact.policy.Action).toEqual(['appsync:Create*', 'appsync:StartSchemaCreation', 'appsync:GraphQL', 'appsync:Update*']);
    expect(iamArtifact.policy.Resource).toHaveLength(2);
    expect(iamArtifact.policy.Resource[0]['Fn::Join'][1][6]).toMatch('/*');
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
