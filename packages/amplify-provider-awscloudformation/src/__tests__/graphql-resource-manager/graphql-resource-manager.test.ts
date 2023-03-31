import { $TSContext, AmplifyError } from 'amplify-cli-core';
import { GraphQLResourceManager } from '../../graphql-resource-manager/amplify-graphql-resource-manager';
jest.mock('../../configuration-manager', () => ({
  loadConfiguration: jest.fn(),
}));
jest.mock('aws-sdk', () => ({
  CloudFormation: jest.fn().mockImplementation(() => {
    return {
      describeStackResources() {
        return {
          promise: jest.fn().mockImplementation(async () => ({
            StackResources: undefined,
          })),
        };
      },
    };
  }),
}));
describe('GraphQLResourceManager', () => {
  describe('createInstance', () => {
    test('when the specified graphql api is not found, an error should be thrown', async () => {
      try {
        await GraphQLResourceManager.createInstance(
          {} as $TSContext,
          {
            providerMetadata: {
              logicalId: '',
            },
          },
          '',
        );
      } catch (e) {
        expect((e as AmplifyError).name).toBe('ApiNotFound');
      }
    });
  });
});
