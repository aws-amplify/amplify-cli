import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, ListValueNode, NamedTypeNode, parse } from 'graphql';
import { getBaseType } from 'graphql-transformer-common';
import {
  doNotExpectFields,
  expectFields,
  expectFieldsOnInputType,
  getFieldOnInputType,
  getFieldOnObjectType,
  getInputType,
  getObjectType,
  verifyInputCount,
  verifyMatchingTypes,
} from './test-utils/helpers';

const featureFlags = {
  getBoolean: jest.fn(),
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
    parse(out.schema);
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

  it('should support non model objects contain id as a type for fields', () => {
    const validSchema = `
      type Post @model {
        id: ID!
        comments: [Comment]
      }
      type Comment {
        id: String!
        text: String!
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
    const commentInput = getInputType(parsed, 'CommentInput');
    expectFieldsOnInputType(commentInput!, ['id', 'text']);
    const commentObject = getObjectType(parsed, 'Comment');
    const commentInputObject = getInputType(parsed, 'CommentInput');
    const commentObjectIDField = getFieldOnObjectType(commentObject!, 'id');
    const commentInputIDField = getFieldOnInputType(commentInputObject!, 'id');
    verifyMatchingTypes(commentObjectIDField.type, commentInputIDField.type);
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();
  });

  it('should throw for reserved type name usage', () => {
    const invalidSchema = `
      type Subscription @model{
        id: Int
        str: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });
    expect(() => transformer.transform(invalidSchema)).toThrowError(
      "'Subscription' is a reserved type name and currently in use within the default schema element.",
    );
  });

  it('should not add default primary key when ID is defined', () => {
    const validSchema = `
      type Post @model{
        id: Int
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
    expect(getBaseType(defaultIdField.type)).toEqual('Int');
    // It should not add default value for ctx.arg.id as id is of type Int
    expect(result.pipelineFunctions['Mutation.createPost.req.vtl']).toMatchSnapshot();
  });

  it('should generate only create mutation', () => {
    const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) {
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
    expectFields(mutationType!, ['customCreatePost']);
    doNotExpectFields(mutationType!, ['updatePost']);
  });

  it('support schema with multiple model directives', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
  
      type User @model {
          id: ID!
          name: String!
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

    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType!, ['listPosts']);
    expectFields(queryType!, ['listUsers']);

    const stringInputType = getInputType(parsed, 'ModelStringFilterInput');
    expect(stringInputType).toBeDefined();
    const booleanInputType = getInputType(parsed, 'ModelBooleanFilterInput');
    expect(booleanInputType).toBeDefined();
    const intInputType = getInputType(parsed, 'ModelIntFilterInput');
    expect(intInputType).toBeDefined();
    const floatInputType = getInputType(parsed, 'ModelFloatFilterInput');
    expect(floatInputType).toBeDefined();
    const idInputType = getInputType(parsed, 'ModelIDFilterInput');
    expect(idInputType).toBeDefined();
    const postInputType = getInputType(parsed, 'ModelPostFilterInput');
    expect(postInputType).toBeDefined();
    const userInputType = getInputType(parsed, 'ModelUserFilterInput');
    expect(userInputType).toBeDefined();

    expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelUserFilterInput', 1)).toBeTruthy();
  });

  it('should support enum as a field', () => {
    const validSchema = `
      enum Status { DELIVERED IN_TRANSIT PENDING UNKNOWN }
      type Test @model {
        status: Status!
        lastStatus: Status!
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

    const createTestInput = getInputType(parsed, 'CreateTestInput');
    expectFieldsOnInputType(createTestInput!, ['status', 'lastStatus']);

    const updateTestInput = getInputType(parsed, 'CreateTestInput');
    expectFieldsOnInputType(updateTestInput!, ['status', 'lastStatus']);
  });

  it('should support non-model types and enums', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
          metadata: [PostMetadata!]!
          appearsIn: [Episode]!
      }
      type PostMetadata {
          tags: Tag
      }
      type Tag {
          published: Boolean
          metadata: PostMetadata
      }
      enum Episode {
          NEWHOPE
          EMPIRE
          JEDI
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

    const postMetaDataInputType = getInputType(parsed, 'PostMetadataInput');
    expect(postMetaDataInputType).toBeDefined();
    const tagInputType = getInputType(parsed, 'TagInput');
    expect(tagInputType).toBeDefined();
    expectFieldsOnInputType(tagInputType!, ['metadata']);
    const createPostInputType = getInputType(parsed, 'CreatePostInput');
    expectFieldsOnInputType(createPostInputType!, ['metadata', 'appearsIn']);
    const updatePostInputType = getInputType(parsed, 'UpdatePostInput');
    expectFieldsOnInputType(updatePostInputType!, ['metadata', 'appearsIn']);

    const postModelObject = getObjectType(parsed, 'Post');
    const postMetaDataInputField = getFieldOnInputType(createPostInputType!, 'metadata');
    const postMetaDataField = getFieldOnObjectType(postModelObject!, 'metadata');
    // this checks that the non-model type was properly "unwrapped", renamed, and "rewrapped"
    // in the generated CreatePostInput type - its types should be the same as in the Post @model type
    verifyMatchingTypes(postMetaDataInputField.type, postMetaDataField.type);

    expect(verifyInputCount(parsed, 'PostMetadataInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TagInput', 1)).toBeTruthy();
  });

  it('it should generate filter inputs', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }`;
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

    const queryType = getObjectType(parsed, 'Query');
    expect(queryType).toBeDefined();
    expectFields(queryType!, ['listPosts']);

    const connectionType = getObjectType(parsed, 'ModelPostConnection');
    expect(connectionType).toBeDefined();

    expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy();
  });

  it('should support advanced subscriptions', () => {
    const validSchema = `type Post @model(subscriptions: {
          onCreate: ["onFeedUpdated", "onCreatePost"],
          onUpdate: ["onFeedUpdated"],
          onDelete: ["onFeedUpdated"]
      }) {
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

    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();
    expectFields(subscriptionType!, ['onFeedUpdated', 'onCreatePost']);
    const subField = subscriptionType!.fields!.find(f => f.name.value === 'onFeedUpdated');
    expect(subField!.directives!.length).toEqual(1);
    expect(subField!.directives![0].name!.value).toEqual('aws_subscribe');
    const mutationsList = subField!.directives![0].arguments!.find(a => a.name.value === 'mutations')!.value as ListValueNode;
    const mutList = mutationsList.values.map((v: any) => v.value);
    expect(mutList.length).toEqual(3);
    expect(mutList).toContain('createPost');
    expect(mutList).toContain('updatePost');
    expect(mutList).toContain('deletePost');
  });
});
