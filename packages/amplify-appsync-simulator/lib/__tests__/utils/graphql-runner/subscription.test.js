"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const schema_1 = require("@graphql-tools/schema");
const type_definition_1 = require("../../../type-definition");
const query_and_mutation_1 = require("../../../utils/graphql-runner/query-and-mutation");
const subscriptions_1 = require("../../../utils/graphql-runner/subscriptions");
jest.mock('../../../utils/graphql-runner/query-and-mutation');
const mockRunQuery = query_and_mutation_1.runQueryOrMutation;
describe('runSubscription', () => {
    const schemaDoc = (0, graphql_1.parse)(`
    type Query {
      getName: String!
    }
    type Subscription {
      onSetName: String
    }
  `);
    let schema;
    let subscriptionResolver = jest.fn();
    let subscriptionSubscribe = jest.fn();
    const executionContext = {
        headers: { 'x-api-key': 'da-fake-key' },
        requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
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
        schema = (0, schema_1.makeExecutableSchema)({ typeDefs: schemaDoc, resolvers });
        mockRunQuery.mockReturnValue({ data: null, errors: [] });
    });
    it('should call subscribe resolver', async () => {
        const doc = (0, graphql_1.parse)(`
      subscription onSetName {
        onSetName
      }
    `);
        const result = await (0, subscriptions_1.runSubscription)(schema, doc, variables, undefined, executionContext);
        expect(typeof result.asyncIterator[Symbol.asyncIterator]).toEqual('function');
        expect(subscriptionSubscribe).toHaveBeenCalled();
        expect(subscriptionSubscribe.mock.calls[0][2]).toEqual(executionContext);
    });
    it('should throw error when the subscription is not authorized', async () => {
        const doc = (0, graphql_1.parse)(`
      subscription onSetName {
        onSetName
      }
    `);
        const resolverError = { data: null, errors: [{ error: 'Unauthorized' }] };
        mockRunQuery.mockReturnValue(resolverError);
        const iterator = await (0, subscriptions_1.runSubscription)(schema, doc, variables, undefined, executionContext);
        expect(iterator[Symbol.asyncIterator]).toBeUndefined();
        expect(iterator).toEqual(resolverError);
        expect(subscriptionSubscribe).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=subscription.test.js.map