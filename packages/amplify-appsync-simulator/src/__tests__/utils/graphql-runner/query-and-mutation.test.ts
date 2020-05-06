import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLSchema, parse } from 'graphql';

import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';

import { runQueryOrMutation } from '../../../utils/graphql-runner/query-and-mutation';

describe('runQueryAndMutation', () => {
  const schemaDoc = parse(/* GraphQL */ `
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
  let schema: GraphQLSchema;

  let executionContext: AppSyncGraphQLExecutionContext;

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
    schema = makeExecutableSchema({ typeDefs: schemaDoc, resolvers });
    executionContext = {
      headers: { 'x-api-key': 'da-fake-key' },
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      appsyncErrors: [],
    };
  });

  it('should run query resolver', async () => {
    const name = 'John Doe';
    const doc = parse(/* GraphQL */ `
      query getName {
        getName
      }
    `);

    const variables = { var1: 'val1' };
    getNameResolver.mockReturnValue(name);
    await expect(runQueryOrMutation(schema, doc, variables, undefined, executionContext)).resolves.toEqual({ data: { getName: name } });
    expect(getNameResolver).toHaveBeenCalled();
    expect(getNameResolver.mock.calls[0][2]).toEqual(executionContext);
  });

  it('should run mutation resolver', async () => {
    const name = 'John Doe';
    setNameResolver.mockReturnValue(name);
    const doc = parse(/* GraphQL */ `
      mutation setName($name: String!) {
        setName(name: $name)
      }
    `);

    const variables = { name };

    getNameResolver.mockReturnValue(name);
    await expect(runQueryOrMutation(schema, doc, variables, undefined, executionContext)).resolves.toEqual({ data: { setName: name } });
    expect(setNameResolver).toHaveBeenCalled();
    expect(setNameResolver.mock.calls[0][1]).toEqual(variables);
    expect(setNameResolver.mock.calls[0][2]).toEqual(executionContext);
  });

  it('should run subscription resolver to ensure auth checks', async () => {
    const name = 'John Doe';
    const doc = parse(/* GraphQL */ `
      subscription onSetName {
        onSetName
      }
    `);

    const variables = {};

    getNameResolver.mockReturnValue(name);
    await expect(runQueryOrMutation(schema, doc, variables, undefined, executionContext)).resolves.toEqual({
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
    const doc = parse(/* GraphQL */ `
      query getName {
        getName
      }
      mutation setName {
        setName(name: "some one")
      }
    `);

    const variables = { var1: 'val1' };
    getNameResolver.mockReturnValue(name);
    await expect(runQueryOrMutation(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({ data: { getName: name } });
    expect(getNameResolver).toHaveBeenCalled();
    expect(getNameResolver.mock.calls[0][2]).toEqual(executionContext);
  });

  it('should have error object populated when the operation does not exist', async () => {
    const name = 'John Doe';
    const doc = parse(/* GraphQL */ `
      query getName {
        getNonExistentQuery
      }
    `);

    const variables = { var1: 'val1' };
    getNameResolver.mockReturnValue(name);
    await expect(runQueryOrMutation(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({
      data: null,
      errors: [new Error(`Cannot query field "getNonExistentQuery" on type "Query".`)],
    });
    expect(getNameResolver).not.toHaveBeenCalled();
  });

  it('should have error object populated when velocity template raises error', async () => {
    const name = 'John Doe';
    const doc = parse(/* GraphQL */ `
      query getName {
        getName
      }
    `);

    executionContext.appsyncErrors = [
      {
        name: 'Template Error',
        message: 'An error from template',
      },
    ];
    const variables = { var1: 'val1' };
    getNameResolver.mockReturnValue(name);

    await expect(runQueryOrMutation(schema, doc, variables, 'getName', executionContext)).resolves.toEqual({
      data: { getName: name },
      errors: executionContext.appsyncErrors,
    });
  });
});
