"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const type_definition_1 = require("../../../type-definition");
const schema_1 = require("@graphql-tools/schema");
const query_and_mutation_1 = require("../../../utils/graphql-runner/query-and-mutation");
describe('runQueryAndMutation', () => {
    const schemaDoc = (0, graphql_1.parse)(`
    type Query {
      getName: String
    }
    type Mutation {
      setName(name: String!): String
    }
    type Subscription {
      onSetName: String
    }
  `);
    const getNameResolver = jest.fn();
    const setNameResolver = jest.fn();
    const onSetNameResolver = jest.fn();
    let schema;
    let executionContext;
    beforeEach(() => {
        jest.resetAllMocks();
        const resolvers = {
            Query: {
                getName: getNameResolver,
            },
            Mutation: {
                setName: setNameResolver,
            },
            Subscription: {
                onSetName: {
                    resolve: onSetNameResolver,
                },
            },
        };
        schema = (0, schema_1.makeExecutableSchema)({ typeDefs: schemaDoc, resolvers });
        executionContext = {
            headers: { 'x-api-key': 'da-fake-key' },
            requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            appsyncErrors: [],
        };
    });
    it('should run query resolver', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      query getName {
        getName
      }
    `);
        const variables = { var1: 'val1' };
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, undefined, executionContext)).resolves.toEqual({ data: { getName: name } });
        expect(getNameResolver).toHaveBeenCalled();
        expect(getNameResolver.mock.calls[0][2]).toEqual(executionContext);
    });
    it('should run mutation resolver', async () => {
        const name = 'John Doe';
        setNameResolver.mockReturnValue(name);
        const doc = (0, graphql_1.parse)(`
      mutation setName($name: String!) {
        setName(name: $name)
      }
    `);
        const variables = { name };
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, undefined, executionContext)).resolves.toEqual({ data: { setName: name } });
        expect(setNameResolver).toHaveBeenCalled();
        expect(setNameResolver.mock.calls[0][1]).toEqual(variables);
        expect(setNameResolver.mock.calls[0][2]).toEqual(executionContext);
    });
    it('should run subscription resolver to ensure auth checks', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      subscription onSetName {
        onSetName
      }
    `);
        const variables = {};
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, undefined, executionContext)).resolves.toEqual({
            data: {
                onSetName: null,
            },
        });
        expect(onSetNameResolver).toHaveBeenCalled();
        expect(onSetNameResolver.mock.calls[0][1]).toEqual(variables);
        expect(onSetNameResolver.mock.calls[0][2]).toEqual(executionContext);
    });
    it('should use operationName when passed to select the query', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      query getName {
        getName
      }
      mutation setName {
        setName(name: "some one")
      }
    `);
        const variables = { var1: 'val1' };
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({ data: { getName: name } });
        expect(getNameResolver).toHaveBeenCalled();
        expect(getNameResolver.mock.calls[0][2]).toEqual(executionContext);
    });
    it('should have error object populated when the operation does not exist', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      query getName {
        getNonExistentQuery
      }
    `);
        const variables = { var1: 'val1' };
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({
            data: null,
            errors: [new Error(`Cannot query field "getNonExistentQuery" on type "Query".`)],
        });
        expect(getNameResolver).not.toHaveBeenCalled();
    });
    it('should have error object populated when velocity template raises error', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      query getName {
        getName
      }
    `);
        const error = new graphql_1.GraphQLError('An error from template');
        executionContext.appsyncErrors = [error];
        const variables = { var1: 'val1' };
        getNameResolver.mockReturnValue(name);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({
            data: { getName: name },
            errors: [error],
        });
    });
    it('should have error object populated when error occurs in the resolver (e.g. Lambda DataSource)', async () => {
        const name = 'John Doe';
        const doc = (0, graphql_1.parse)(`
      query getName {
        getName
      }
    `);
        const error = {
            name: 'Lambda Error',
            type: 'Lambda:Unhandled',
            message: 'An error from the resolver',
        };
        executionContext.appsyncErrors = [error];
        const variables = { var1: 'val1' };
        getNameResolver.mockReturnValue(null);
        await expect((0, query_and_mutation_1.runQueryOrMutation)(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({
            data: { getName: null },
            errors: [error],
        });
    });
});
//# sourceMappingURL=query-and-mutation.test.js.map