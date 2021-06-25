import {
  ObjectTypeDefinitionNode,
  parse,
  FieldDefinitionNode,
  DocumentNode,
  DefinitionNode,
  Kind,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';
import { GraphQLTransform, ConflictHandlerType, TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { ResolverResourceIDs } from 'graphql-transformer-common';
import { ModelConnectionTransformer } from '../ModelConnectionTransformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

test('ModelConnectionTransformer should fail if connection was called on an object that is not a Model type.', () => {
  const validSchema = `
    type Test {
        id: ID!
        email: String!
        testObj: Test1 @connection(fields: ["email"])
    }

    type Test1 @model {
        id: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError(`@connection must be on an @model object type field.`);
});

test('ModelConnectionTransformer should fail if connection was with an object that is not a Model type.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: Test1 @connection(fields: ["email"])
    }

    type Test1 {
        id: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError(`Object type Test1 must be annotated with @model.`);
});

test('ModelConnectionTransformer should fail if the field type where the directive is called is incorrect.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: Test2 @connection(fields: ["email"])
    }

    type Test1 @model {
        id: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('Unknown type "Test2". Did you mean "Test" or "Test1"?');
});

test('ModelConnectionTransformer should fail if an empty list of fields is passed in.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @connection(fields: [])
    }

    type Test1 @model {
        id: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('No fields passed in to @connection directive.');
});

test('ModelConnectionTransformer should fail if any of the fields passed in are not in the Parent model.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @connection(fields: ["id", "name"])
    }

    type Test1
        @model
        @key(fields: ["id", "name"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('name is not a field in Test');
});

test('ModelConnectionTransformer should fail if the query is not run on the default table when connection is trying to connect a single object.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: Test1 @connection(keyName: "notDefault", fields: ["id"])
    }

    type Test1
        @model
        @key(name: "notDefault", fields: ["friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError(
    'Connection is to a single object but the keyName notDefault was provided which does not reference the default table.',
  );
});

test('ModelConnectionTransformer should fail if keyName provided does not exist.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String
        testObj: [Test1] @connection(keyName: "notDefault", fields: ["id"])
    }

    type Test1 @model {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('Key notDefault does not exist for model Test1');
});

test('ModelConnectionTransformer should fail if first field does not match PK of table. (When using default table)', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: Test1 @connection(fields: ["email"])
    }

    type Test1 @model {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
});

test('ModelConnectionTransformer should fail if sort key type passed in does not match default table sort key type.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @connection(fields: ["id", "email"])
    }

    type Test1
        @model
        @key(fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
});

test('ModelConnectionTransformer should fail if partial sort key is passed in connection.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @connection(keyName: "testIndex", fields: ["id", "email"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID", "name"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError(
    'Invalid @connection directive  testObj. fields does not accept partial sort key',
  );
});

test('ModelConnectionTransformer should accept connection without sort key', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @connection(keyName: "testIndex", fields: ["id"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID", "name"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).not.toThrowError();
});

test('ModelConnectionTransformer should fail if sort key type passed in does not match custom index sort key type.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @connection(keyName: "testIndex", fields: ["id", "email"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
});

test('ModelConnectionTransformer should fail if partition key type passed in does not match custom index partition key type.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @connection(keyName: "testIndex", fields: ["email", "id"])
    }

    type Test1
        @model
        @key(name: "testIndex", fields: ["id", "friendID"])
    {
        id: ID!
        friendID: ID!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  expect(() => transformer.transform(validSchema)).toThrowError('email field is not of type ID');
});

test('Test ModelConnectionTransformer for One-to-One getItem case.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        otherHalf: Test1 @connection(fields: ["id", "email"])
    }

    type Test1
        @model
        @key(fields: ["id", "email"])
    {
        id: ID!
        friendID: ID!
        email: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Test', 'otherHalf')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const testObjType = getObjectType(schemaDoc, 'Test');
  expectFields(testObjType, ['otherHalf']);
  const relatedField = testObjType.fields.find(f => f.name.value === 'otherHalf');
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);
});

test('Test ModelConnectionTransformer for One-to-Many query case.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        otherParts: [Test1] @connection(fields: ["id", "email"])
    }

    type Test1
        @model
        @key(fields: ["id", "email"])
    {
        id: ID!
        friendID: ID!
        email: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Test', 'otherParts')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const testObjType = getObjectType(schemaDoc, 'Test');
  expectFields(testObjType, ['otherParts']);
  const relatedField = testObjType.fields.find(f => f.name.value === 'otherParts');

  expect(relatedField.arguments.length).toEqual(4);
  expectArguments(relatedField, ['filter', 'limit', 'nextToken', 'sortDirection']);
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
});

test('Test ModelConnectionTransformer for bidirectional One-to-Many query case.', () => {
  const validSchema = `
    type Post
        @model
        @key(name: "byOwner", fields: ["owner", "id"])
    {
        id: ID!
        title: String!
        author: User @connection(fields: ["owner"])
        owner: ID!
    }
    type User @model {
        id: ID!
        posts: [Post] @connection(keyName: "byOwner", fields: ["id"])
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'author')]).toBeTruthy();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('User', 'posts')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const userType = getObjectType(schemaDoc, 'User');
  expectFields(userType, ['posts']);
  const postsField = userType.fields.find(f => f.name.value === 'posts');

  expect(postsField.arguments.length).toEqual(5);
  expectArguments(postsField, ['id', 'filter', 'limit', 'nextToken', 'sortDirection']);
  expect(postsField.type.kind).toEqual(Kind.NAMED_TYPE);

  expect((postsField.type as any).name.value).toEqual('ModelPostConnection');

  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['author']);
  const userField = postType.fields.find(f => f.name.value === 'author');
  expect(userField.type.kind).toEqual(Kind.NAMED_TYPE);
});

test('Test ModelConnectionTransformer for One-to-Many query with a composite sort key.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        name: String!
        otherParts: [Test1] @connection(fields: ["id", "email", "name"])
    }

    type Test1
        @model
        @key(fields: ["id", "email", "name"])
    {
        id: ID!
        friendID: ID!
        email: String!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Test', 'otherParts')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const testObjType = getObjectType(schemaDoc, 'Test');
  expectFields(testObjType, ['otherParts']);
  const relatedField = testObjType.fields.find(f => f.name.value === 'otherParts');

  expect(relatedField.arguments.length).toEqual(4);
  expectArguments(relatedField, ['filter', 'limit', 'nextToken', 'sortDirection']);
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
});
test('Test ModelConnectionTransformer for One-to-Many query with a composite sort key passed in as an argument.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        name: String!
        otherParts: [Test1] @connection(fields: ["id"])
    }

    type Test1
        @model
        @key(fields: ["id", "email", "name"])
    {
        id: ID!
        friendID: ID!
        email: String!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Test', 'otherParts')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const testObjType = getObjectType(schemaDoc, 'Test');
  expectFields(testObjType, ['otherParts']);
  const relatedField = testObjType.fields.find(f => f.name.value === 'otherParts');

  expect(relatedField.arguments.length).toEqual(5);
  expectArguments(relatedField, ['emailName', 'filter', 'limit', 'nextToken', 'sortDirection']);
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
});

test('Test ModelConnectionTransformer for One-to-One getItem with composite sort key.', () => {
  const validSchema = `
    type Test @model {
        id: ID!
        email: String!
        name: String!
        otherHalf: Test1 @connection(fields: ["id", "email", "name"])
    }

    type Test1
        @model
        @key(fields: ["id", "email", "name"])
    {
        id: ID!
        friendID: ID!
        email: String!
        name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.ConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Test', 'otherHalf')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  const testObjType = getObjectType(schemaDoc, 'Test');
  expectFields(testObjType, ['otherHalf']);
  const relatedField = testObjType.fields.find(f => f.name.value === 'otherHalf');
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);
});

test('Many-to-many without conflict resolution generates correct schema', () => {
  const validSchema = `
    type Post @model {
      id: ID!
      title: String!
      editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
    }

    # Create a join model and disable queries as you don't need them
    # and can query through Post.editors and User.posts
    type PostEditor
      @model(queries: null)
      @key(name: "byPost", fields: ["postID", "editorID"])
      @key(name: "byEditor", fields: ["editorID", "postID"]) {
      id: ID!
      postID: ID!
      editorID: ID!
      post: Post! @connection(fields: ["postID"])
      editor: User! @connection(fields: ["editorID"])
    }

    type User @model {
      id: ID!
      username: String!
      posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
    transformConfig: {
      Version: TRANSFORM_CURRENT_VERSION,
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.schema).toMatchSnapshot();
});

test('Many-to-many with conflict resolution generates correct schema', () => {
  const validSchema = `
    type Post @model {
      id: ID!
      title: String!
      editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
    }

    # Create a join model and disable queries as you don't need them
    # and can query through Post.editors and User.posts
    type PostEditor
      @model(queries: null)
      @key(name: "byPost", fields: ["postID", "editorID"])
      @key(name: "byEditor", fields: ["editorID", "postID"]) {
      id: ID!
      postID: ID!
      editorID: ID!
      post: Post! @connection(fields: ["postID"])
      editor: User! @connection(fields: ["editorID"])
    }

    type User @model {
      id: ID!
      username: String!
      posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer(), new ModelConnectionTransformer()],
    featureFlags,
    transformConfig: {
      Version: TRANSFORM_CURRENT_VERSION,
      ResolverConfig: {
        project: {
          ConflictHandler: ConflictHandlerType.AUTOMERGE,
          ConflictDetection: 'VERSION',
        },
      },
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.schema).toMatchSnapshot();
});

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

// Taken from ModelConnectionTransformer.test.ts
function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
}

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

function expectArguments(field: FieldDefinitionNode, args: string[]) {
  for (const argName of args) {
    const foundArg = field.arguments.find((a: InputValueDefinitionNode) => a.name.value === argName);
    expect(foundArg).toBeDefined();
  }
}
