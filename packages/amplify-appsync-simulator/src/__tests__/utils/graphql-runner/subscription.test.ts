import { GraphQLSchema, parse } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { runQueryOrMutation } from '../../../utils/graphql-runner/query-and-mutation';
import { runSubscription, SubscriptionResult } from '../../../utils/graphql-runner/subscriptions';
import { AmplifyAppSyncSimulator } from '../../..';

jest.mock('../../../utils/graphql-runner/query-and-mutation');
const mockRunQuery = runQueryOrMutation as jest.Mock;
describe('runSubscription', () => {
  const schemaDoc = parse(/* GraphQL */ `
    type Profile {
      name: String
    }
    type Query {
      getProfile: Profile!
    }
    type Subscription {
      onChangeProfile(name: String): Profile
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

  let simulator: AmplifyAppSyncSimulator;

  beforeEach(() => {
    jest.resetAllMocks();
    simulator = new AmplifyAppSyncSimulator();
    // Use the real async iterator to test the filter
    subscriptionSubscribe.mockImplementation((rootValue, args, context, info) => simulator.asyncIterator('onChangeProfile', rootValue, args, context, info));

    const resolvers = {
      Subscription: {
        onChangeProfile: {
          resolve: subscriptionResolver,
          subscribe: subscriptionSubscribe,
        },
      },
    };
    /*eslint-disable spellcheck/spell-checker*/
    schema = makeExecutableSchema({ typeDefs: schemaDoc, resolvers });
    mockRunQuery.mockReturnValue({ data: null, errors: [] });
  });

  it('should call subscribe resolver (without filter)', async () => {
    const doc = parse(/* GraphQL */ `
      subscription onChangeProfile {
        onChangeProfile
      }
    `);

    const result = await runSubscription(schema, doc, variables, undefined, executionContext);
    expect(typeof (result as SubscriptionResult).asyncIterator[Symbol.asyncIterator]).toEqual('function');
    expect(subscriptionSubscribe).toHaveBeenCalled();
    expect(subscriptionSubscribe.mock.calls[0][2]).toEqual(executionContext);
    // Trigger a mock mutation
    setTimeout(async () => {
      /*eslint-disable spellcheck/spell-checker*/
      await simulator.pubsub.publish('onChangeProfile', { name: 'sam' });
    }, 1000);
    // Will resolve once the mutation executes
    await (result as SubscriptionResult).asyncIterator.next();
    expect(subscriptionResolver).toHaveBeenCalled();
    expect(subscriptionResolver.mock.calls[0][0]).toEqual({ name: 'sam' });
  });

  it('should call subscribe resolver with filter', async () => {
    const doc = parse(/* GraphQL */ `
      subscription onChangeProfile {
        onChangeProfile(name: "mac") {
          name
        }
      }
    `);

    const result = await runSubscription(schema, doc, variables, undefined, executionContext);
    expect(typeof (result as SubscriptionResult).asyncIterator[Symbol.asyncIterator]).toEqual('function');
    expect(subscriptionSubscribe).toHaveBeenCalled();
    expect(subscriptionSubscribe.mock.calls[0][2]).toEqual(executionContext);
    // Trigger a mock mutation
    setTimeout(async () => {
      /*eslint-disable spellcheck/spell-checker*/
      await simulator.pubsub.publish('onChangeProfile', { name: 'mac' });
    }, 1000);
    // Will resolve once the mutation executes
    await (result as SubscriptionResult).asyncIterator.next();
    expect(subscriptionResolver).toHaveBeenCalled();
    expect(subscriptionResolver.mock.calls[0][0]).toEqual({ name: 'mac' });
  });

  /* eslint-disable jest/no-done-callback*/
  it('should not call subscribe resolver when the params are not matching', done => {
    const doc = parse(/* GraphQL */ `
      subscription onSetName {
        onChangeProfile(name: "mac")
      }
    `);

    runSubscription(schema, doc, variables, undefined, executionContext).then(result => {
      expect(typeof (result as SubscriptionResult).asyncIterator[Symbol.asyncIterator]).toEqual('function');
      expect(subscriptionSubscribe).toHaveBeenCalled();
      expect(subscriptionSubscribe.mock.calls[0][2]).toEqual(executionContext);
      setTimeout(async () => {
        /*eslint-disable spellcheck/spell-checker*/
        await simulator.pubsub.publish('onChangeProfile', { name: 'James' });
      }, 1000);
      // This will not be resolved as the filter and the mutation payload are not matching.
      // timeout will be triggered instead
      setTimeout(() => {
        done();
      }, 1500);
      (result as SubscriptionResult).asyncIterator.next().then(() => {
        throw new Error('Should not trigger subscription if the filter is not matching');
      });
    });
  });

  it('should throw error when the subscription is not authorized', async () => {
    const doc = parse(/* GraphQL */ `
      subscription onChangeProfile {
        onChangeProfile
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
