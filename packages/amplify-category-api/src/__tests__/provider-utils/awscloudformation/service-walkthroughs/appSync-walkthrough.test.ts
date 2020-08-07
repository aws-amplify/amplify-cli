import { getIAMPolicies } from '../../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import { authConfigHasApiKey } from '../../../../provider-utils/awscloudformation/utils/amplify-meta-utils';
jest.mock('../../../../provider-utils/awscloudformation/utils/amplify-meta-utils', () => ({
  getAppSyncAuthConfig: jest.fn(),
  authConfigHasApiKey: jest.fn(),
}));

const authConfigHasApiKey_mock = authConfigHasApiKey as jest.MockedFunction<typeof authConfigHasApiKey>;
const context_stub = {
  amplify: {
    getProjectMeta: jest.fn(),
  },
};

describe('get IAM policies', () => {
  it('does not include API key if none exists', () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => false);
    const { attributes } = getIAMPolicies('testResourceName', ['read'], context_stub);
    expect(attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
      ]
    `);
  });

  it('includes API key if it exists', () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => true);
    const { attributes } = getIAMPolicies('testResourceName', ['read'], context_stub);
    expect(attributes).toMatchInlineSnapshot(`
      Array [
        "GraphQLAPIIdOutput",
        "GraphQLAPIEndpointOutput",
        "GraphQLAPIKeyOutput",
      ]
    `);
  });
});
