import { GraphQLTransform, TRANSFORM_CURRENT_VERSION, ConflictHandlerType } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { SearchableModelTransformer } from '../SearchableModelTransformer';

test('Test SearchableModelTransformer validation happy case', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with query overrides', () => {
  const validSchema = `type Post @model @searchable(queries: { search: "customSearchPost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with only create mutations', () => {
  const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with multiple model searchable directives', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }

    type User @model @searchable {
        id: ID!
        name: String!
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with sort fields', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('SearchableModelTransformer with external versioning', () => {
  const expectedSearchResolverBase = 'Query.searchPosts.';
  const expectedSearchRequestResolver = expectedSearchResolverBase + 'req.vtl';
  const expectedSearchResponseResolver = expectedSearchResolverBase + 'res.vtl';
  const validSchema = `
        type Post @model @searchable {
          id: ID!
          title: String!
        }
      `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new SearchableModelTransformer()],
    transformConfig: {
      Version: TRANSFORM_CURRENT_VERSION,
      ResolverConfig: {
        project: {
          ConflictDetection: 'VERSION',
          ConflictHandler: ConflictHandlerType.AUTOMERGE,
        },
        models: undefined,
      },
    },
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers).toBeDefined();
  expect(out.resolvers[expectedSearchRequestResolver]).toBeDefined();
  expect(out.resolvers[expectedSearchRequestResolver]).toMatchSnapshot();
  expect(out.resolvers[expectedSearchResponseResolver]).toBeDefined();
  expect(out.resolvers[expectedSearchResponseResolver]).toMatchSnapshot();
});
