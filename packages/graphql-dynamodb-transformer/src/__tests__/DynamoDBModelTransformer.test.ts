import {
  ObjectTypeDefinitionNode,
  parse,
  FieldDefinitionNode,
  DocumentNode,
  DefinitionNode,
  Kind,
  InputObjectTypeDefinitionNode,
  ListValueNode,
  InputValueDefinitionNode,
  TypeNode,
  NamedTypeNode,
} from 'graphql';
import { GraphQLTransform, TRANSFORM_BASE_VERSION, TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBModelTransformer } from '../DynamoDBModelTransformer';

test('Test DynamoDBModelTransformer validation happy case', () => {
  const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
});

test('Test DynamoDBModelTransformer with query overrides', () => {
  const validSchema = `type Post @model(queries: { get: "customGetPost", list: "customListPost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const createPostInput = getInputType(parsed, 'CreatePostInput');
  expectFieldsOnInputType(createPostInput, ['id', 'title', 'createdAt', 'updatedAt']);
  // This id should always be optional.
  // aka a named type node aka name.value would not be set if it were a non null node
  const idField = createPostInput.fields.find(f => f.name.value === 'id');
  expect((idField.type as NamedTypeNode).name.value).toEqual('ID');
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).toBeDefined();
  expectFields(queryType, ['customGetPost']);
  expectFields(queryType, ['customListPost']);
  const subscriptionType = getObjectType(parsed, 'Subscription');
  expect(subscriptionType).toBeDefined();
  expectFields(subscriptionType, ['onCreatePost', 'onUpdatePost', 'onDeletePost']);
  const subField = subscriptionType.fields.find(f => f.name.value === 'onCreatePost');
  expect(subField.directives.length).toEqual(1);
  expect(subField.directives[0].name.value).toEqual('aws_subscribe');
});

test('Test DynamoDBModelTransformer with mutation overrides', () => {
  const validSchema = `type Post @model(mutations: { create: "customCreatePost", update: "customUpdatePost", delete: "customDeletePost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).toBeDefined();
  expectFields(mutationType, ['customCreatePost', 'customUpdatePost', 'customDeletePost']);
});

test('Test DynamoDBModelTransformer with only create mutations', () => {
  const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).toBeDefined();
  expectFields(mutationType, ['customCreatePost']);
  doNotExpectFields(mutationType, ['updatePost']);
});

test('Test DynamoDBModelTransformer with multiple model directives', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).toBeDefined();
  expectFields(queryType, ['listPosts']);
  expectFields(queryType, ['listUsers']);

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

test('Test DynamoDBModelTransformer with filter', () => {
  const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).toBeDefined();
  expectFields(queryType, ['listPosts']);

  const connectionType = getObjectType(parsed, 'ModelPostConnection');
  expect(connectionType).toBeDefined();

  expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy();
});

test('Test DynamoDBModelTransformer with mutations set to null', () => {
  const validSchema = `type Post @model(mutations: null) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).not.toBeDefined();
});
test('Test DynamoDBModelTransformer with queries set to null', () => {
  const validSchema = `type Post @model(queries: null) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).toBeDefined();
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).not.toBeDefined();
});
test('Test DynamoDBModelTransformer with subscriptions set to null', () => {
  const validSchema = `type Post @model(subscriptions: null) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).toBeDefined();
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).toBeDefined();
  const subscriptionType = getObjectType(parsed, 'Subscription');
  expect(subscriptionType).not.toBeDefined();
});
test('Test DynamoDBModelTransformer with queries and mutations set to null', () => {
  const validSchema = `type Post @model(queries: null, mutations: null, subscriptions: null) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
      }
      `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const mutationType = getObjectType(parsed, 'Mutation');
  expect(mutationType).not.toBeDefined();
  const queryType = getObjectType(parsed, 'Query');
  expect(queryType).not.toBeDefined();
  const subscriptionType = getObjectType(parsed, 'Subscription');
  expect(subscriptionType).not.toBeDefined();
});
test('Test DynamoDBModelTransformer with advanced subscriptions', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const subscriptionType = getObjectType(parsed, 'Subscription');
  expect(subscriptionType).toBeDefined();
  expectFields(subscriptionType, ['onFeedUpdated', 'onCreatePost']);
  const subField = subscriptionType.fields.find(f => f.name.value === 'onFeedUpdated');
  expect(subField.directives.length).toEqual(1);
  expect(subField.directives[0].name.value).toEqual('aws_subscribe');
  const mutationsList = subField.directives[0].arguments.find(a => a.name.value === 'mutations').value as ListValueNode;
  const mutList = mutationsList.values.map((v: any) => v.value);
  expect(mutList.length).toEqual(3);
  expect(mutList).toContain('createPost');
  expect(mutList).toContain('updatePost');
  expect(mutList).toContain('deletePost');
});

test('Test DynamoDBModelTransformer with non-model types and enums', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);

  const postMetaDataInputType = getInputType(parsed, 'PostMetadataInput');
  expect(postMetaDataInputType).toBeDefined();
  const tagInputType = getInputType(parsed, 'TagInput');
  expect(tagInputType).toBeDefined();
  expectFieldsOnInputType(tagInputType, ['metadata']);
  const createPostInputType = getInputType(parsed, 'CreatePostInput');
  expectFieldsOnInputType(createPostInputType, ['metadata', 'appearsIn']);
  const updatePostInputType = getInputType(parsed, 'UpdatePostInput');
  expectFieldsOnInputType(updatePostInputType, ['metadata', 'appearsIn']);

  const postModelObject = getObjectType(parsed, 'Post');
  const postMetaDataInputField = getFieldOnInputType(createPostInputType, 'metadata');
  const postMetaDataField = getFieldOnObjectType(postModelObject, 'metadata');
  // this checks that the non-model type was properly "unwrapped", renamed, and "rewrapped"
  // in the generated CreatePostInput type - its types should be the same as in the Post @model type
  verifyMatchingTypes(postMetaDataInputField.type, postMetaDataField.type);

  expect(verifyInputCount(parsed, 'PostMetadataInput', 1)).toBeTruthy();
  expect(verifyInputCount(parsed, 'TagInput', 1)).toBeTruthy();
});

test('Test DynamoDBModelTransformer with mutation input overrides when mutations are disabled', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const createPostInput = getInputType(parsed, 'CreatePostInput');
  expectFieldsOnInputType(createPostInput, ['different']);
  const updatePostInput = getInputType(parsed, 'UpdatePostInput');
  expectFieldsOnInputType(updatePostInput, ['different2']);
  const deletePostInput = getInputType(parsed, 'DeletePostInput');
  expectFieldsOnInputType(deletePostInput, ['different3']);
});

test('Test DynamoDBModelTransformer with mutation input overrides when mutations are enabled', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const createPostInput = getInputType(parsed, 'CreatePostInput');
  expectFieldsOnInputType(createPostInput, ['different']);
  const updatePostInput = getInputType(parsed, 'UpdatePostInput');
  expectFieldsOnInputType(updatePostInput, ['different2']);
  const deletePostInput = getInputType(parsed, 'DeletePostInput');
  expectFieldsOnInputType(deletePostInput, ['different3']);
});

test('Test non model objects contain id as a type for fields', () => {
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
    transformers: [new DynamoDBModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const definition = out.schema;
  expect(definition).toBeDefined();
  const parsed = parse(definition);
  const commentInput = getInputType(parsed, 'CommentInput');
  expectFieldsOnInputType(commentInput, ['id', 'text']);
  const commentObject = getObjectType(parsed, 'Comment');
  const commentInputObject = getInputType(parsed, 'CommentInput');
  const commentObjectIDField = getFieldOnObjectType(commentObject, 'id');
  const commentInputIDField = getFieldOnInputType(commentInputObject, 'id');
  verifyMatchingTypes(commentObjectIDField.type, commentInputIDField.type);
});

test(`V${TRANSFORM_BASE_VERSION} transformer snapshot test`, () => {
  const schema = transformerVersionSnapshot(TRANSFORM_BASE_VERSION);
  expect(schema).toMatchSnapshot();
});

test(`V5 transformer snapshot test`, () => {
  const schema = transformerVersionSnapshot(5);
  expect(schema).toMatchSnapshot();
});

test(`Current version transformer snapshot test`, () => {
  const schema = transformerVersionSnapshot(TRANSFORM_CURRENT_VERSION);
  expect(schema).toMatchSnapshot();
});

function transformerVersionSnapshot(version: number): string {
  const validSchema = `
        type Post @model
        {
          id: ID!
          content: String
        }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer()],
    transformConfig: {
      Version: version,
    },
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  return out.schema;
}

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

function expectFieldsOnInputType(type: InputObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

function getFieldOnInputType(type: InputObjectTypeDefinitionNode, field: string): InputValueDefinitionNode {
  return type.fields.find((f: InputValueDefinitionNode) => f.name.value === field);
}

function getFieldOnObjectType(type: ObjectTypeDefinitionNode, field: string): FieldDefinitionNode {
  return type.fields.find((f: FieldDefinitionNode) => f.name.value === field);
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    expect(type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)).toBeUndefined();
  }
}

function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
}

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
  return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
}

function verifyMatchingTypes(t1: TypeNode, t2: TypeNode): boolean {
  if (t1.kind !== t2.kind) {
    return false;
  }

  if (t1.kind !== Kind.NAMED_TYPE && t2.kind !== Kind.NAMED_TYPE) {
    verifyMatchingTypes(t1.type, t2.type);
  } else {
    return false;
  }
}
