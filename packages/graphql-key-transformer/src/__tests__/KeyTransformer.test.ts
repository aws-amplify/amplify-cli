import { parse, InputObjectTypeDefinitionNode, DefinitionNode, DocumentNode, Kind } from 'graphql';
import { GraphQLTransform, InvalidDirectiveError, SyncConfig, ConflictHandlerType, FeatureFlagProvider } from 'graphql-transformer-core';
import { KeyTransformer } from '../KeyTransformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';

test('Check KeyTransformer Resolver Code', () => {
  const validSchema = `
    type Item @model
        @key(fields: ["orderId", "status", "createdAt"])
        @key(name: "ByStatus", fields: ["status", "createdAt"], queryField: "itemsByStatus")
        @key(name: "ByCreatedAt", fields: ["createdAt", "status"], queryField: "itemsByCreatedAt")
    {
        orderId: ID!
        status: Status!
        createdAt: AWSDateTime!
        name: String!
    }
    enum Status {
      DELIVERED IN_TRANSIT PENDING UNKNOWN
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers).toMatchSnapshot();
});
test('KeyTransformer should fail if more than 1 @key is provided without a name.', () => {
  const invalidSchema = `
    type Test @key(fields: ["id"]) @key(fields: ["email"]) {
        id: ID!
        email: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });

  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('KeyTransformer should fail if more than 1 @key is provided with the same name.', () => {
  const invalidSchema = `
    type Test @key(name: "Test", fields: ["id"]) @key(name: "Test", fields: ["email"]) {
        id: ID!
        email: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });

  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('KeyTransformer should fail if referencing a field that does not exist.', () => {
  const invalidSchema = `
    type Test @key(fields: ["someWeirdId"]) {
        id: ID!
        email: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });

  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('Test that a primary @key fails if pointing to nullable fields.', () => {
  const invalidSchema = `
    type Test @key(fields: ["email"]) {
        id: ID!
        email: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });

  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('Test that model with an LSI but no primary sort key will fail.', () => {
  const invalidSchema = `
    type Test @key(fields: ["id"]) @key(name: "SomeLSI", fields: ["id", "email"]) {
        id: ID!
        email: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });
  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('KeyTransformer should fail if a non-existing type field is defined as key field.', () => {
  const invalidSchema = `
    type Test @key(name: "Test", fields: ["one"]) {
        id: ID!
        email: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new KeyTransformer()],
  });

  expect(() => transformer.transform(invalidSchema)).toThrowError(InvalidDirectiveError);
});

test('Check sortDirection validation code present in list resolver code for simple keys', () => {
  const validSchema = `
    type Blog
      @model
      @key(fields: ["id"])
    {
      id: ID!
      title: String!
      createdAt: AWSDateTime!
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.resolvers['Query.listBlogs.req.vtl']).toMatchSnapshot();
});

test('Check sortDirection validation code present in list resolver code for compound keys', () => {
  const validSchema = `
    type Blog
      @model
      @key(fields: ["id", "createdAt"])
    {
      id: ID!
      title: String!
      createdAt: AWSDateTime!
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.resolvers['Query.listBlogs.req.vtl']).toMatchSnapshot();
});

test('KeyTransformer should remove default primary key when primary key overidden', () => {
  const validSchema = /* GraphQL */ `
    type Blog @model @key(fields: ["blogId", "createdAt"]) {
      blogId: ID!
      title: String!
      createdAt: AWSDateTime!
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  const createBlogInput: InputObjectTypeDefinitionNode = schema.definitions.find(
    d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateBlogInput',
  ) as InputObjectTypeDefinitionNode | undefined;
  expect(createBlogInput).toBeDefined();
  const defaultIdField = createBlogInput.fields.find(f => f.name.value === 'id');
  expect(defaultIdField).toBeUndefined();
});

test('KeyTransformer should not remove default primary key when primary key not overidden', () => {
  const validSchema = /* GraphQL */ `
    type Blog @model @key(name: "btBlogIdAndCreatedAt", fields: ["blogId", "createdAt"]) {
      blogId: ID!
      title: String!
      createdAt: AWSDateTime!
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  const createBlogInput: InputObjectTypeDefinitionNode = schema.definitions.find(
    d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateBlogInput',
  ) as InputObjectTypeDefinitionNode | undefined;
  expect(createBlogInput).toBeDefined();
  const defaultIdField = createBlogInput.fields.find(f => f.name.value === 'id');
  expect(defaultIdField).toBeDefined();
});

test('Check KeyTransformer Resolver Code when sync enabled', () => {
  const validSchema = `
    type Item @model
        @key(fields: ["orderId", "status", "createdAt"])
        @key(name: "ByStatus", fields: ["status", "createdAt"], queryField: "itemsByStatus")
        @key(name: "ByCreatedAt", fields: ["createdAt", "status"], queryField: "itemsByCreatedAt")
    {
        orderId: ID!
        status: Status!
        createdAt: AWSDateTime!
        name: String!
    }
    enum Status {
      DELIVERED IN_TRANSIT PENDING UNKNOWN
    }`;
  const config: SyncConfig = {
    ConflictDetection: 'VERSION',
    ConflictHandler: ConflictHandlerType.AUTOMERGE,
  };
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
    transformConfig: {
      ResolverConfig: {
        project: config,
      },
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.resolvers).toMatchSnapshot();
});

test('Test that sort direction and filter input are generated if default list query does not exist', () => {
  const validSchema = `
    type Todo
      @model(queries: { get: "getTodo" })
      @key(
        name: "byCreatedAt"
        fields: ["createdAt"]
        queryField: "byCreatedAt"
      ){
      id: ID!
      description: String
      createdAt: AWSDateTime
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  const sortDirection = schema.definitions.find(d => d.kind === 'EnumTypeDefinition' && d.name.value === 'ModelSortDirection');
  expect(sortDirection).toBeDefined();
  const stringInputType = getInputType(schema, 'ModelStringFilterInput');
  expect(stringInputType).toBeDefined();
  const booleanInputType = getInputType(schema, 'ModelBooleanFilterInput');
  expect(booleanInputType).toBeDefined();
  const intInputType = getInputType(schema, 'ModelIntFilterInput');
  expect(intInputType).toBeDefined();
  const floatInputType = getInputType(schema, 'ModelFloatFilterInput');
  expect(floatInputType).toBeDefined();
  const idInputType = getInputType(schema, 'ModelIDFilterInput');
  expect(idInputType).toBeDefined();
  const todoInputType = getInputType(schema, 'ModelTodoFilterInput');
  expect(todoInputType).toBeDefined();
});

test('GSI composite sort keys are wrapped in conditional to check presence in mutation', () => {
  const validSchema = /* GraphQL */ `
    type Person
      @model
      @key(fields: ["id", "firstName", "lastName"])
      @key(name: "byNameAndAge", fields: ["firstName", "age", "birthDate"], queryField: "getPersonByNameByDate")
      @key(name: "byNameAndNickname", fields: ["firstName", "lastName", "nickname"]) {
      id: ID!
      firstName: String!
      lastName: String!
      birthDate: AWSDate
      nickname: String
      age: Int
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
  });

  const result = transformer.transform(validSchema);
  expect(result?.resolvers?.['Mutation.createPerson.req.vtl']).toMatchSnapshot();
  expect(result?.resolvers?.['Mutation.updatePerson.req.vtl']).toMatchSnapshot();
});

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

describe('check schema input', () => {
  let ff: FeatureFlagProvider;
  beforeEach(() => {
    ff = {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'skipOverrideMutationInputTypes') {
          return true;
        }
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    };
  });

  it('@model mutation with user defined null args ', () => {
    const validSchema = /* GraphQL */ `
      type Call
        @model(queries: null, mutations: null)
        @key(fields: ["receiverId", "senderId"])
        @key(name: "bySender", fields: ["senderId", "receiverId"]) {
        senderId: ID!
        receiverId: ID!
      }

      type Mutation {
        createCall(input: CreateCallInput!): Call
        deleteCall(input: DeleteCallInput!): Call
      }

      input CreateCallInput {
        receiverId: ID!
      }

      input DeleteCallInput {
        receiverId: ID!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
      featureFlags: ff,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);

    const DeleteCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(DeleteCallInput).toBeDefined();
    const receiverIdField = DeleteCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdField).toBeDefined();
    expect(receiverIdField.type.kind).toBe('NonNullType');
    const senderIdField = DeleteCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdField).toBeUndefined();
  });

  it('@model mutation with user defined create args ', () => {
    const validSchema = /* GraphQL */ `
      type Call
        @model(queries: null, mutations: { delete: "testDelete" })
        @key(fields: ["receiverId", "senderId"])
        @key(name: "bySender", fields: ["senderId", "receiverId"]) {
        senderId: ID!
        receiverId: ID!
      }

      input CreateCallInput {
        receiverId: ID!
      }

      input DeleteCallInput {
        receiverId: ID!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
      featureFlags: ff,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);

    const DeleteCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(DeleteCallInput).toBeDefined();
    const receiverIdField = DeleteCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdField).toBeDefined();
    expect(receiverIdField.type.kind).toBe('NonNullType');
    const senderIdField = DeleteCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdField).toBeDefined();
    expect(senderIdField.type.kind).toBe('NonNullType');
  });

  it('@model mutation with default', () => {
    const validSchema = /* GraphQL */ `
      type Call @model @key(fields: ["receiverId", "senderId"]) @key(name: "bySender", fields: ["senderId", "receiverId"]) {
        senderId: ID!
        receiverId: ID!
      }

      input CreateCallInput {
        receiverId: ID!
      }

      input DeleteCallInput {
        receiverId: ID!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
      featureFlags: ff,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);

    // checlk for delete input
    const DeleteCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(DeleteCallInput).toBeDefined();
    const receiverIdField = DeleteCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdField).toBeDefined();
    expect(receiverIdField.type.kind).toBe('NonNullType');
    const senderIdField = DeleteCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdField).toBeDefined();
    expect(senderIdField.type.kind).toBe('NonNullType');

    // check for create input
    const CreateCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(CreateCallInput).toBeDefined();
    const receiverIdFieldCreate = CreateCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdFieldCreate).toBeDefined();
    expect(receiverIdFieldCreate.type.kind).toBe('NonNullType');
    const senderIdFieldCreate = CreateCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdFieldCreate).toBeUndefined();
  });

  it('@model mutation with queries', () => {
    const validSchema = /* GraphQL */ `
      type Call @model(queries: null) @key(fields: ["receiverId", "senderId"]) @key(name: "bySender", fields: ["senderId", "receiverId"]) {
        senderId: ID!
        receiverId: ID!
      }
      input CreateCallInput {
        receiverId: ID!
      }

      input DeleteCallInput {
        receiverId: ID!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
      featureFlags: ff,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);

    // checlk for delete input
    const DeleteCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(DeleteCallInput).toBeDefined();
    const receiverIdField = DeleteCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdField).toBeDefined();
    expect(receiverIdField.type.kind).toBe('NonNullType');
    const senderIdField = DeleteCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdField).toBeDefined();
    expect(senderIdField.type.kind).toBe('NonNullType');

    // check for create input
    const CreateCallInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateCallInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(CreateCallInput).toBeDefined();
    const receiverIdFieldCreate = CreateCallInput.fields.find(f => f.name.value === 'receiverId');
    expect(receiverIdFieldCreate).toBeDefined();
    expect(receiverIdFieldCreate.type.kind).toBe('NonNullType');
    const senderIdFieldCreate = CreateCallInput.fields.find(f => f.name.value === 'senderId');
    expect(senderIdFieldCreate).toBeUndefined();
  });

  it('id field should be optional in updateInputObjects when it is not a primary key', () => {
    const validSchema = /* GraphQL */ `
      type Review
        @model(subscriptions: { level: off })
        @key(fields: ["owner", "serviceId"])
        @key(name: "byService", fields: ["serviceId", "createdAt"], queryField: "listReviewsByService")
        @key(name: "byStatus", fields: ["owner", "status", "createdAt"], queryField: "listReviewsByStatus")
        @key(name: "byId", fields: ["id"], queryField: "listReviewsById") {
        id: ID!
        serviceId: ID!
        owner: String!
        rating: Int
        title: String
        status: String
        createdAt: AWSDateTime!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new KeyTransformer()],
      featureFlags: ff,
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const schema = parse(out.schema);

    const UpdateReviewInput: InputObjectTypeDefinitionNode = schema.definitions.find(
      d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'UpdateReviewInput',
    ) as InputObjectTypeDefinitionNode | undefined;
    expect(UpdateReviewInput).toBeDefined();
    const idField = UpdateReviewInput.fields.find(f => f.name.value === 'id');
    expect(idField).toBeDefined();
    expect(idField.type.kind).toBe('NamedType');
  });
});
