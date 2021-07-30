import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { FeatureFlagProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, NamedTypeNode, parse } from 'graphql';
import { getBaseType } from 'graphql-transformer-common';
import {
  expectFields,
  expectFieldsOnInputType,
  getFieldOnInputType,
  getFieldOnObjectType,
  getInputType,
  getObjectType,
  verifyMatchingTypes,
} from './test-utils/helpers';

const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'validateTypeNameReservedWords') {
      return false;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

describe('ModelTransformer: ', () => {
  it('should successfully transform simple valid schema', async () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    validateModelSchema(parse(out.schema));
  });

  it('should support custom query overrides', () => {
    const validSchema = `type Post @model(queries: { get: "customGetPost", list: "customListPost" }) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const createPostInput = getInputType(parsed, 'CreatePostInput');
    expect(createPostInput).toBeDefined();

    expectFieldsOnInputType(createPostInput!, ['id', 'title', 'createdAt', 'updatedAt']);

    // This id should always be optional.
    // aka a named type node aka name.value would not be set if it were a non null node
    const idField = createPostInput!.fields!.find(f => f.name.value === 'id');
    expect((idField!.type as NamedTypeNode).name!.value).toEqual('ID');
    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType!, ['customGetPost']);
    expectFields(queryType!, ['customListPost']);
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();
    expectFields(subscriptionType!, ['onCreatePost', 'onUpdatePost', 'onDeletePost']);
    const subField = subscriptionType!.fields!.find(f => f.name.value === 'onCreatePost');
    expect(subField).toBeDefined();
    expect(subField!.directives!.length).toEqual(1);
    expect(subField!.directives![0].name!.value).toEqual('aws_subscribe');
  });

  it('should support custom mutations overrides', () => {
    const validSchema = `type Post @model(mutations: { create: "customCreatePost", update: "customUpdatePost", delete: "customDeletePost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsedDefinition = parse(definition);
    validateModelSchema(parsedDefinition);
    const mutationType = getObjectType(parsedDefinition, 'Mutation');
    expect(mutationType).toBeDefined();
    expectFields(mutationType!, ['customCreatePost', 'customUpdatePost', 'customDeletePost']);
  });

  it('should not generate mutations when mutations are set to null', () => {
    const validSchema = `type Post @model(mutations: null) {
            id: ID!
            title: String!
            createdAt: String
            updatedAt: String
        }
        `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).not.toBeDefined();
  });

  it('should not generate queries when queries are set to null', () => {
    const validSchema = `type Post @model(queries: null) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).toBeDefined();
    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).not.toBeDefined();
  });

  it('should not generate subscriptions with subscriptions are set to null', () => {
    const validSchema = `type Post @model(subscriptions: null) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).toBeDefined();
    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).not.toBeDefined();
  });

  it('should not generate subscriptions, mutations or queries when subscriptions, queries and mutations set to null', () => {
    const validSchema = `type Post @model(queries: null, mutations: null, subscriptions: null) {
            id: ID!
            title: String!
            createdAt: String
            updatedAt: String
        }
        `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).not.toBeDefined();
    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).not.toBeDefined();
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).not.toBeDefined();
  });

  it('should support mutation input overrides when mutations are disabled', () => {
    const validSchema = `type Post @model(mutations: null) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      input CreatePostInput {
          different: String
      }
      input UpdatePostInput {
          different2: String
      }
      input DeletePostInput {
          different3: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const createPostInput = getInputType(parsed, 'CreatePostInput');
    expectFieldsOnInputType(createPostInput!, ['different']);
    const updatePostInput = getInputType(parsed, 'UpdatePostInput');
    expectFieldsOnInputType(updatePostInput!, ['different2']);
    const deletePostInput = getInputType(parsed, 'DeletePostInput');
    expectFieldsOnInputType(deletePostInput!, ['different3']);
  });

  it('should support mutation input overrides when mutations are enabled', () => {
    const validSchema = `type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    # User defined types always take precedence.
    input CreatePostInput {
        different: String
    }
    input UpdatePostInput {
        different2: String
    }
    input DeletePostInput {
        different3: String
    }
  `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const definition = out.schema;
    expect(definition).toBeDefined();
    const parsed = parse(definition);
    validateModelSchema(parsed);
    const createPostInput = getInputType(parsed, 'CreatePostInput');
    expectFieldsOnInputType(createPostInput!, ['different']);
    const updatePostInput = getInputType(parsed, 'UpdatePostInput');
    expectFieldsOnInputType(updatePostInput!, ['different2']);
    const deletePostInput = getInputType(parsed, 'DeletePostInput');
    expectFieldsOnInputType(deletePostInput!, ['different3']);
  });

  it('should add default primary key when not defined', () => {
    const validSchema = `
      type Post @model{
        str: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const result = transformer.transform(validSchema);
    expect(result).toBeDefined();
    expect(result.schema).toBeDefined();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    const createPostInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreatePostInput',
    )! as InputObjectTypeDefinitionNode;
    expect(createPostInput).toBeDefined();
    const defaultIdField: InputValueDefinitionNode = createPostInput.fields!.find(f => f.name.value === 'id')!;
    expect(defaultIdField).toBeDefined();
    expect(getBaseType(defaultIdField.type)).toEqual('ID');
  });

  it('should compile schema successfully when subscription is missing from schema', () => {
    const validSchema = `
    type Post @model {
      id: Int
      str: String
    }
  
    type Query {
      Custom: String
    }
  
    schema {
      query: Query
    }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const parsed = parse(out.schema);
    validateModelSchema(parsed);
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();
    expectFields(subscriptionType!, ['onCreatePost', 'onUpdatePost', 'onDeletePost']);
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).toBeDefined();
    expectFields(mutationType!, ['createPost', 'updatePost', 'deletePost']);
  });

  it('should not validate reserved type names when validateTypeNameReservedWords is off', () => {
    const schema = `
    type Subscription @model{
      id: Int
      str: String
    }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags: ({
        getBoolean: jest.fn().mockImplementation(name => (name === 'validateTypeNameReservedWords' ? false : undefined)),
      } as unknown) as FeatureFlagProvider,
    });
    const out = transformer.transform(schema);
    expect(out).toBeDefined();
    const parsed = parse(out.schema);
    validateModelSchema(parsed);
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();
  });
});
