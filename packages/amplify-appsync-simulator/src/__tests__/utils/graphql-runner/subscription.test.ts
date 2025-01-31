import { GraphQLSchema, parse } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { runQueryOrMutation } from '../../../utils/graphql-runner/query-and-mutation';
import { runSubscription, SubscriptionResult } from '../../../utils/graphql-runner/subscriptions';

jest.mock('../../../utils/graphql-runner/query-and-mutation');
const mockRunQuery = runQueryOrMutation as jest.Mock;
describe('runSubscription', () => {
  const schemaDoc = parse(/* GraphQL */ `
    type Query {
      getName: String!
    }
    type Subscription {
      onSetName: String
    }
  `);
  let schema: GraphQLSchema;

  const subscriptionResolver = jest.fn();
  const subscriptionSubscribe = jest.fn();

  const executionContext: AppSyncGraphQLExecutionContext = {
    headers: { 'x-api-key': 'da-fake-key' },
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    appsyncErrors: [],
  };
  const variables = {};

  beforeEach(() => {
    jest.resetAllMocks();
    subscriptionSubscribe.mockImplementation(() => {
      return {
        [Symbol.asyncIterator]: () => {
          return {
            async next() {
              return { done: false, value: 42 };
            },
          };
        },
      };
    });

    const resolvers = {
      Subscription: {
        onSetName: {
          resolve: subscriptionResolver,
          subscribe: subscriptionSubscribe,
        },
      },
    };
    schema = makeExecutableSchema({ typeDefs: schemaDoc, resolvers });
    mockRunQuery.mockReturnValue({ data: null, errors: [] });
  });

  it('should call subscribe resolver', async () => {
    const doc = parse(/* GraphQL */ `
      subscription onSetName {
        onSetName
      }
    `);

    const result = await runSubscription(schema, doc, variables, undefined, executionContext);
    expect(typeof (result as SubscriptionResult).asyncIterator[Symbol.asyncIterator]).toEqual('function');
    expect(subscriptionSubscribe).toHaveBeenCalled();
    expect(subscriptionSubscribe.mock.calls[0][2]).toEqual(executionContext);
  });

  it('should throw error when the subscription is not authorized', async () => {
    const doc = parse(/* GraphQL */ `
      subscription onSetName {
        onSetName
      }
    `);

    const resolverError = { data: null, errors: [{ error: 'Unauthorized' }] };
    mockRunQuery.mockReturnValue(resolverError);
    const iterator = await runSubscription(schema, doc, variables, undefined, executionContext);
    expect(iterator[Symbol.asyncIterator]).toBeUndefined();
    expect(iterator).toEqual(resolverError);
    expect(subscriptionSubscribe).not.toHaveBeenCalled();
  });
});
