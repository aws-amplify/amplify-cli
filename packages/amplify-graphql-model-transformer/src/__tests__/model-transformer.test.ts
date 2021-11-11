import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { ConflictHandlerType, GraphQLTransform, SyncConfig, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
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
import { expect as cdkExpect, haveResource } from '@aws-cdk/assert';

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
    expect(result.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
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

    const stringInputType = getInputType(parsed, 'ModelStringInput');
    expect(stringInputType).toBeDefined();
    const booleanInputType = getInputType(parsed, 'ModelBooleanInput');
    expect(booleanInputType).toBeDefined();
    const intInputType = getInputType(parsed, 'ModelIntInput');
    expect(intInputType).toBeDefined();
    const floatInputType = getInputType(parsed, 'ModelFloatInput');
    expect(floatInputType).toBeDefined();
    const idInputType = getInputType(parsed, 'ModelIDInput');
    expect(idInputType).toBeDefined();
    const postInputType = getInputType(parsed, 'ModelPostFilterInput');
    expect(postInputType).toBeDefined();
    const userInputType = getInputType(parsed, 'ModelUserFilterInput');
    expect(userInputType).toBeDefined();

    expect(verifyInputCount(parsed, 'ModelStringInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDInput', 1)).toBeTruthy();
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

    expect(verifyInputCount(parsed, 'ModelStringInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDInput', 1)).toBeTruthy();
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

  it('should not generate superfluous input and filter types', () => {
    const validSchema = `
    type Entity @model(mutations: null, subscriptions: null, queries: {get: "getEntity"}) {
      id: ID!
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
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);
  });

  it('should support timestamp parameters when generating resolvers and output schema', () => {
    const validSchema = `
    type Post @model(timestamps: { createdAt: "createdOn", updatedAt: "updatedOn"}) {
      id: ID!
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
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    expect(result.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(result.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
  });

  it('should not to auto generate createdAt and updatedAt when the type in schema is not AWSDateTime', () => {
    const validSchema = `
  type Post @model {
    id: ID!
    str: String
    createdAt: AWSTimestamp
    updatedAt: AWSTimestamp
  }
  `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });
    const result = transformer.transform(validSchema);
    expect(result).toBeDefined();
    expect(result.schema).toBeDefined();
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    expect(result.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(result.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
  });

  it('should have timestamps as nullable fields when the type makes it non-nullable', () => {
    const validSchema = `
      type Post @model {
        id: ID!
        str: String
        createdAt: AWSDateTime!
        updatedAt: AWSDateTime!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });

    const result = transformer.transform(validSchema);
    expect(result).toBeDefined();
    expect(result.schema).toBeDefined();
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    expect(result.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(result.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
  });

  it('should not to include createdAt and updatedAt field when timestamps is set to null', () => {
    const validSchema = `
    type Post @model(timestamps: null) {
      id: ID!
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
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    expect(result.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(result.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
  });

  it('should filter known input types from create and update input fields', () => {
    const validSchema = `
      type Test @model {
        id: ID!
        email: Email
      }

      type Email @model {
        id: ID!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
    });

    const result = transformer.transform(validSchema);
    expect(result).toBeDefined();
    expect(result.schema).toBeDefined();
    expect(result.schema).toMatchSnapshot();
    const schema = parse(result.schema);
    validateModelSchema(schema);

    const createTestInput = getInputType(schema, 'CreateTestInput');
    expect(getFieldOnInputType(createTestInput!, 'email')).toBeUndefined();

    const updateTestInput = getInputType(schema, 'UpdateTestInput');
    expect(getFieldOnInputType(updateTestInput!, 'email')).toBeUndefined();
  });

  it('should generate enum input objects', () => {
    const validSchema = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
        metadata: PostMetadata
        entityMetadata: EntityMetadata
        appearsIn: [Episode!]
        episode: Episode
      }
      type Author @model {
        id: ID!
        name: String!
        postMetadata: PostMetadata
        entityMetadata: EntityMetadata
      }
      type EntityMetadata {
        isActive: Boolean
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
      type Require @model {
        id: ID!
        requiredField: String!
        notRequiredField: String
      }
      type Comment @model(timestamps: { createdAt: "createdOn", updatedAt: "updatedOn" }) {
        id: ID!
        title: String!
        content: String
        updatedOn: Int # No automatic generation of timestamp if its not AWSDateTime
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
    expect(result.schema).toMatchSnapshot();
    expect(verifyInputCount(schema, 'ModelEpisodeInput', 1)).toBeTruthy();
  });

  it('should support support scalar list', () => {
    const validSchema = /* GraphQL */ `
      type Post @model {
        id: ID!
        author: String!
        title: String
        content: String
        url: String
        ups: Int
        downs: Int
        version: Int
        postedAt: String
        createdAt: AWSDateTime
        comments: [String!]
        ratings: [Int!]
        percentageUp: Float
        isPublished: Boolean
        jsonField: AWSJSON
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

  it('should generate sync resolver with ConflictHandlerType.Automerge', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
      }
    `;

    const config: SyncConfig = {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.AUTOMERGE,
    };

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
      transformConfig: {
        ResolverConfig: {
          project: config,
        },
      },
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();
    expect(out.resolvers).toMatchSnapshot();

    validateModelSchema(parse(definition));
  });

  it('should generate sync resolver with ConflictHandlerType.LAMBDA', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
    `;

    const config: SyncConfig = {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.LAMBDA,
      LambdaConflictHandler: {
        name: 'myLambdaConflictHandler',
      },
    };

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
      transformConfig: {
        ResolverConfig: {
          project: config,
        },
      },
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();
    expect(out.resolvers).toMatchSnapshot();

    validateModelSchema(parse(definition));
  });

  it('should generate sync resolver with ConflictHandlerType.Optimistic', () => {
    const validSchema = `
      type Post @model {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
    `;

    const config: SyncConfig = {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.OPTIMISTIC,
    };

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
      transformConfig: {
        ResolverConfig: {
          project: config,
        },
      },
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();
    expect(out.resolvers).toMatchSnapshot();

    validateModelSchema(parse(definition));
  });

  it('should generate iam role names under 64 chars and subscriptions under 50', () => {
    const validSchema = `
      type ThisIsAVeryLongNameModelThatShouldNotGenerateIAMRoleNamesOver64Characters @model {
          id: ID!
          title: String!
      }
    `;

    const config: SyncConfig = {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.AUTOMERGE,
    };

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
      featureFlags,
      transformConfig: {
        ResolverConfig: {
          project: config,
        },
      },
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeDefined();

    subscriptionType!.fields!.forEach(it => {
      expect(it.name.value.length <= 50).toBeTruthy();
    });

    const iamStackResource = out.stacks.ThisIsAVeryLongNameModelThatShouldNotGenerateIAMRoleNamesOver64Characters;
    expect(iamStackResource).toBeDefined();
    cdkExpect(iamStackResource).to(
      haveResource('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'appsync.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        RoleName: {
          'Fn::Join': [
            '',
            [
              'ThisIsAVeryLongNameM2d9fca-',
              {
                Ref: 'referencetotransformerrootstackGraphQLAPI20497F53ApiId',
              },
              '-',
              {
                Ref: 'referencetotransformerrootstackenv10C5A902Ref',
              },
            ],
          ],
        },
      }),
    );

    validateModelSchema(parsed);
  });

  it('should generate the ID field when not specified', () => {
    const validSchema = `type Todo @model {
      name: String
    }`;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);

    const createTodoInput = getInputType(parsed, 'CreateTodoInput');
    expect(createTodoInput).toBeDefined();

    expectFieldsOnInputType(createTodoInput!, ['id', 'name']);

    const idField = createTodoInput!.fields!.find(f => f.name.value === 'id');
    expect((idField!.type as NamedTypeNode).name!.value).toEqual('ID');
    expect((idField!.type as NamedTypeNode).kind).toEqual('NamedType');

    const updateTodoInput = getInputType(parsed, 'UpdateTodoInput');
    expect(updateTodoInput).toBeDefined();

    expectFieldsOnInputType(updateTodoInput!, ['name']);
  });
  it('the datastore table should be configured', () => {
    const validSchema = `
    type Todo @model {
      name: String
    }`;

    const transformer = new GraphQLTransform({
      transformConfig: {
        ResolverConfig: {
          project: {
            ConflictDetection: 'VERSION',
            ConflictHandler: ConflictHandlerType.AUTOMERGE,
          },
        },
      },
      sandboxModeEnabled: true,
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);
    validateModelSchema(schema);
    // sync operation
    const queryObject = getObjectType(schema, 'Query');
    expectFields(queryObject!, ['syncTodos']);
    // sync resolvers
    expect(out.resolvers['Query.syncTodos.req.vtl']).toMatchSnapshot();
    expect(out.resolvers['Query.syncTodos.res.vtl']).toMatchSnapshot();
    // ds table
    cdkExpect(out.rootStack).to(
      haveResource('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'ds_pk',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'ds_sk',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'ds_pk',
            AttributeType: 'S',
          },
          {
            AttributeName: 'ds_sk',
            AttributeType: 'S',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        TableName: {
          'Fn::Join': [
            '',
            [
              'AmplifyDataStore-',
              {
                'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
              },
              '-',
              {
                Ref: 'env',
              },
            ],
          ],
        },
        TimeToLiveSpecification: {
          AttributeName: '_ttl',
          Enabled: true,
        },
      }),
    );
  });

  it('should add the model parameters at the root sack', () => {
    const modelParams = {
      DynamoDBModelTableReadIOPS: expect.objectContaining({
        Type: 'Number',
        Default: 5,
        Description: 'The number of read IOPS the table should support.',
      }),
      DynamoDBModelTableWriteIOPS: expect.objectContaining({
        Type: 'Number',
        Default: 5,
        Description: 'The number of write IOPS the table should support.',
      }),
      DynamoDBBillingMode: expect.objectContaining({
        Type: 'String',
        Default: 'PAY_PER_REQUEST',
        AllowedValues: ['PAY_PER_REQUEST', 'PROVISIONED'],
        Description: 'Configure @model types to create DynamoDB tables with PAY_PER_REQUEST or PROVISIONED billing modes.',
      }),
      DynamoDBEnablePointInTimeRecovery: expect.objectContaining({
        Type: 'String',
        Default: 'false',
        AllowedValues: ['true', 'false'],
        Description: 'Whether to enable Point in Time Recovery on the table.',
      }),
      DynamoDBEnableServerSideEncryption: expect.objectContaining({
        Type: 'String',
        Default: 'true',
        AllowedValues: ['true', 'false'],
        Description: 'Enable server side encryption powered by KMS.',
      }),
    };
    const validSchema = `type Todo @model {
      name: String
    }`;
    const transformer = new GraphQLTransform({
      sandboxModeEnabled: true,
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(validSchema);

    const rootStack = out.rootStack;
    expect(rootStack).toBeDefined();
    expect(rootStack.Parameters).toMatchObject(modelParams);

    const todoStack = out.stacks['Todo'];
    expect(todoStack).toBeDefined();
    expect(todoStack.Parameters).toMatchObject(modelParams);
  });
});
