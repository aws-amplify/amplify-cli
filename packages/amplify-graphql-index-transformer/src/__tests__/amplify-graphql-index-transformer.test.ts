import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { ConflictHandlerType, GraphQLTransform, SyncConfig, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { expect as cdkExpect, haveResourceLike } from '@aws-cdk/assert';
import { Kind, parse } from 'graphql';
import { IndexTransformer, PrimaryKeyTransformer } from '..';

test('throws if @index is used in a non-@model type', () => {
  const schema = `
    type Test {
      id: ID! @index(name: "index1")
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow('The @index directive may only be added to object definitions annotated with @model.');
});

test('throws if the same index name is defined multiple times on an object', () => {
  const schema = `
    type Test @model {
      id: ID! @index(name: "index1")
      email: String! @index(name: "index1")
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`You may only supply one @index with the name 'index1' on type 'Test'.`);
});

test('throws if an invalid LSI is created', () => {
  const schema = `
    type Test @model {
      id: ID! @primaryKey @index(name: "index1")
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(
    `Invalid @index 'index1'. You may not create an index where the partition key is the same as that of the primary key unless the primary key has a sort field. You cannot have a local secondary index without a sort key in the primary key.`,
  );
});

test('throws if @index is used on a non-scalar field', () => {
  const schema = `
    type NonScalar {
      id: ID!
    }

    type Test @model {
      id: NonScalar! @index(name: "wontwork")
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`Index 'wontwork' on type 'Test.id' cannot be a non-scalar.`);
});

test('throws if @index uses a sort key field that does not exist', () => {
  const schema = `
    type Test @model {
      id: ID! @index(name: "wontwork", sortKeyFields: ["doesnotexist"])
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`Can't find field 'doesnotexist' in Test, but it was specified in index 'wontwork'.`);
});

test('throws if @index uses a sort key field that is a non-scalar', () => {
  const schema = `
    type NonScalar {
      id: ID!
    }

    type Test @model {
      id: ID! @index(name: "wontwork", sortKeyFields: ["email"])
      email: NonScalar
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The sort key of index 'wontwork' on type 'Test.email' cannot be a non-scalar.`);
});

test('throws if @index refers to itself', () => {
  const schema = `
    type Test @model {
      id: ID! @index(name: "wontwork", sortKeyFields: ["id"])
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`@index field 'id' cannot reference itself.`);
});

test('@index with multiple sort keys adds a query field and GSI correctly', () => {
  const inputSchema = `
    type Test @model {
      email: String! @index(name: "GSI", sortKeyFields: ["kind", "date"], queryField: "listByEmailKindDate")
      kind: Int!
      date: AWSDateTime!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'kind#date', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
            { AttributeName: 'kind#date', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            'Fn::If': [
              'ShouldUsePayPerRequestBilling',
              { Ref: 'AWS::NoValue' },
              {
                ReadCapacityUnits: { Ref: 'DynamoDBModelTableReadIOPS' },
                WriteCapacityUnits: { Ref: 'DynamoDBModelTableWriteIOPS' },
              },
            ],
          },
        },
      ],
    }),
  );

  cdkExpect(stack).to(
    haveResourceLike('AWS::AppSync::Resolver', {
      FieldName: 'listByEmailKindDate',
      TypeName: 'Query',
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  expect(queryType).toBeDefined();

  const getTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField).toBeDefined();
  expect(getTestField.arguments).toHaveLength(1);
  expect(getTestField.arguments[0].name.value).toEqual('id');

  const listTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestField).toBeDefined();
  expect(listTestField.arguments).toHaveLength(3);
  expect(listTestField.arguments[0].name.value).toEqual('filter');
  expect(listTestField.arguments[1].name.value).toEqual('limit');
  expect(listTestField.arguments[2].name.value).toEqual('nextToken');

  const queryField = queryType.fields.find((f: any) => f.name && f.name.value === 'listByEmailKindDate');
  expect(queryField).toBeDefined();
  expect(queryField.arguments).toHaveLength(6);
  expect(queryField.arguments[0].name.value).toEqual('email');
  expect(queryField.arguments[1].name.value).toEqual('kindDate');
  expect(queryField.arguments[2].name.value).toEqual('sortDirection');
  expect(queryField.arguments[2].type.name.value).toEqual('ModelSortDirection');
  expect(queryField.arguments[3].name.value).toEqual('filter');
  expect(queryField.arguments[3].type.name.value).toEqual('ModelTestFilterInput');
  expect(queryField.arguments[4].name.value).toEqual('limit');
  expect(queryField.arguments[4].type.name.value).toEqual('Int');
  expect(queryField.arguments[5].name.value).toEqual('nextToken');
  expect(queryField.arguments[5].type.name.value).toEqual('String');
});

test('@index with a single sort key adds a query field and GSI correctly', () => {
  const inputSchema = `
    type Test @model {
      email: String!
      createdAt: AWSDateTime!
      category: String! @index(name: "CategoryGSI", sortKeyFields: "createdAt", queryField: "testsByCategory")
      description: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'category', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CategoryGSI',
          KeySchema: [
            { AttributeName: 'category', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
        },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  expect(queryType).toBeDefined();

  const getTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField).toBeDefined();
  expect(getTestField.arguments).toHaveLength(1);
  expect(getTestField.arguments[0].name.value).toEqual('id');

  const listTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestField).toBeDefined();
  expect(listTestField.arguments).toHaveLength(3);
  expect(listTestField.arguments[0].name.value).toEqual('filter');
  expect(listTestField.arguments[1].name.value).toEqual('limit');
  expect(listTestField.arguments[2].name.value).toEqual('nextToken');

  const queryField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByCategory');
  expect(queryField).toBeDefined();
  expect(queryField.arguments).toHaveLength(6);
  expect(queryField.arguments[0].name.value).toEqual('category');
  expect(queryField.arguments[1].name.value).toEqual('createdAt');
  expect(queryField.arguments[2].name.value).toEqual('sortDirection');
  expect(queryField.arguments[2].type.name.value).toEqual('ModelSortDirection');
  expect(queryField.arguments[3].name.value).toEqual('filter');
  expect(queryField.arguments[3].type.name.value).toEqual('ModelTestFilterInput');
  expect(queryField.arguments[4].name.value).toEqual('limit');
  expect(queryField.arguments[4].type.name.value).toEqual('Int');
  expect(queryField.arguments[5].name.value).toEqual('nextToken');
  expect(queryField.arguments[5].type.name.value).toEqual('String');
});

test('@index with no sort key field adds a query field and GSI correctly', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String! @index(name: "GSI_Email", queryField: "testsByEmail")
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI_Email',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  expect(queryType).toBeDefined();

  const getTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField).toBeDefined();
  expect(getTestField.arguments).toHaveLength(1);
  expect(getTestField.arguments[0].name.value).toEqual('id');

  const listTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestField).toBeDefined();
  expect(listTestField.arguments).toHaveLength(3);
  expect(listTestField.arguments[0].name.value).toEqual('filter');
  expect(listTestField.arguments[1].name.value).toEqual('limit');
  expect(listTestField.arguments[2].name.value).toEqual('nextToken');

  const queryField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByEmail');
  expect(queryField).toBeDefined();
  expect(queryField.arguments).toHaveLength(5);
  expect(queryField.arguments[0].name.value).toEqual('email');
  expect(queryField.arguments[1].name.value).toEqual('sortDirection');
  expect(queryField.arguments[1].type.name.value).toEqual('ModelSortDirection');
  expect(queryField.arguments[2].name.value).toEqual('filter');
  expect(queryField.arguments[2].type.name.value).toEqual('ModelTestFilterInput');
  expect(queryField.arguments[3].name.value).toEqual('limit');
  expect(queryField.arguments[3].type.name.value).toEqual('Int');
  expect(queryField.arguments[4].name.value).toEqual('nextToken');
  expect(queryField.arguments[4].type.name.value).toEqual('String');
});

test('@index with no queryField does not generate a query field', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String! @index(name: "GSI_Email")
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  expect(queryType).toBeDefined();

  const queryField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByEmail');
  expect(queryField).toBeUndefined();
});

test('creates a primary key and a secondary index', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey(sortKeyFields: ["createdAt"])
      createdAt: AWSDateTime!
      category: String! @index(name: "CategoryGSI", sortKeyFields: ["createdAt"], queryField: "testsByCategory")
      description: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'category', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CategoryGSI',
          KeySchema: [
            { AttributeName: 'category', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
        },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  expect(queryType).toBeDefined();

  const getTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField).toBeDefined();
  expect(getTestField.arguments).toHaveLength(2);
  expect(getTestField.arguments[0].name.value).toEqual('email');
  expect(getTestField.arguments[1].name.value).toEqual('createdAt');

  const listTestField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestField).toBeDefined();
  expect(listTestField.arguments).toHaveLength(6);
  expect(listTestField.arguments[0].name.value).toEqual('email');
  expect(listTestField.arguments[1].name.value).toEqual('createdAt');
  expect(listTestField.arguments[2].name.value).toEqual('filter');
  expect(listTestField.arguments[3].name.value).toEqual('limit');
  expect(listTestField.arguments[4].name.value).toEqual('nextToken');
  expect(listTestField.arguments[5].name.value).toEqual('sortDirection');

  const queryField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByCategory');
  expect(queryField).toBeDefined();
  expect(queryField.arguments).toHaveLength(6);
  expect(queryField.arguments[0].name.value).toEqual('category');
  expect(queryField.arguments[1].name.value).toEqual('createdAt');
  expect(queryField.arguments[2].name.value).toEqual('sortDirection');
  expect(queryField.arguments[2].type.name.value).toEqual('ModelSortDirection');
  expect(queryField.arguments[3].name.value).toEqual('filter');
  expect(queryField.arguments[3].type.name.value).toEqual('ModelTestFilterInput');
  expect(queryField.arguments[4].name.value).toEqual('limit');
  expect(queryField.arguments[4].type.name.value).toEqual('Int');
  expect(queryField.arguments[5].name.value).toEqual('nextToken');
  expect(queryField.arguments[5].type.name.value).toEqual('String');
});

test('connection type is generated for custom query when queries is set to null', () => {
  const inputSchema = `
    type ContentCategory @model(queries: null, mutations: { create: "addContentToCategory", delete: "deleteContentFromCategory" })
    {
      id: ID!
      category: Int! @index(name: "ContentByCategory", sortKeyFields: ["type", "language", "datetime"], queryField: "listContentByCategory")
      datetime: String!
      type: String!
      language: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const modelContentCategoryConnection = schema.definitions.find(
    (def: any) => def.name && def.name.value === 'ModelContentCategoryConnection',
  );

  expect(modelContentCategoryConnection).toBeDefined();
});

test('does not remove default primary key when primary key is not overidden', () => {
  const inputSchema = `
    type Blog @model {
      blogId: ID! @index(name: "btBlogIdAndCreatedAt", sortKeyFields: ["createdAt"])
      title: String!
      createdAt: AWSDateTime!
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const createBlogInput = schema.definitions.find(
    (d: any) => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateBlogInput',
  ) as any;
  expect(createBlogInput).toBeDefined();
  const defaultIdField = createBlogInput.fields.find((f: any) => f.name.value === 'id');
  expect(defaultIdField).toBeDefined();
});

test('sort direction and filter input are generated if default list query does not exist', () => {
  const inputSchema = `
    type Todo @model(queries: { get: "getTodo" }) {
      id: ID!
      description: String
      createdAt: AWSDateTime @index(name: "byCreatedAt", queryField: "byCreatedAt")
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const sortDirection = schema.definitions.find((d: any) => d.kind === 'EnumTypeDefinition' && d.name.value === 'ModelSortDirection');
  expect(sortDirection).toBeDefined();
  const todoInputType = schema.definitions.find((def: any) => def.name && def.name.value === 'ModelTodoFilterInput');
  expect(todoInputType).toBeDefined();
});

test('@index adds an LSI with secondaryKeyAsGSI FF set to false', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey(sortKeyFields: "createdAt") @index(name: "LSI_Email_UpdatedAt", sortKeyFields: "updatedAt" queryField: "testsByEmailByUpdatedAt")
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
    featureFlags: {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'secondaryKeyAsGSI') {
          return false;
        }
        return;
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'updatedAt', AttributeType: 'S' },
      ],
      LocalSecondaryIndexes: [
        {
          IndexName: 'LSI_Email_UpdatedAt',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' },
          ],
        },
      ],
    }),
  );

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  const queryIndexField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByEmailByUpdatedAt');
  expect(queryIndexField.arguments).toHaveLength(6);

  const listTestsField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestsField.arguments).toHaveLength(6);
});

test('@index adds a GSI with secondaryKeyAsGSI FF set to true', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey(sortKeyFields: "createdAt") @index(name: "GSI_Email_UpdatedAt", sortKeyFields: "updatedAt" queryField: "testsByEmailByUpdatedAt")
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
    featureFlags: {
      getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
        if (name === 'secondaryKeyAsGSI') {
          return true;
        }
        return;
      }),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'updatedAt', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI_Email_UpdatedAt',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' },
          ],
        },
      ],
    }),
  );

  const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as any;
  const queryIndexField = queryType.fields.find((f: any) => f.name && f.name.value === 'testsByEmailByUpdatedAt');
  expect(queryIndexField.arguments).toHaveLength(6);

  const listTestsField = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestsField.arguments).toHaveLength(6);
});

test('validate resolver code', () => {
  const inputSchema = `
    type Item @model {
      orderId: ID! @primaryKey(sortKeyFields: ["status", "createdAt"])
      status: Status! @index(name: "ByStatus", sortKeyFields: ["createdAt"], queryField: "itemsByStatus")
      createdAt: AWSDateTime! @index(name: "ByCreatedAt", sortKeyFields: ["status"], queryField: "itemsByCreatedAt")
      name: String!
    }
    enum Status {
      DELIVERED IN_TRANSIT PENDING UNKNOWN
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  expect(out.resolvers).toMatchSnapshot();
  validateModelSchema(parse(out.schema));
});

it('@model mutation with user defined null args ', () => {
  const inputSchema = `
    type Call @model(queries: null, mutations: null) {
      senderId: ID! @index(name: "bySender", sortKeyFields: ["receiverId"])
      receiverId: ID! @primaryKey(sortKeyFields: ["senderId"])
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
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const DeleteCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput') as any;
  expect(DeleteCallInput).toBeDefined();
  const receiverIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdField).toBeDefined();
  expect(receiverIdField.type.kind).toBe('NonNullType');

  const senderIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdField).toBeUndefined();
});

it('@model mutation with user defined create args ', () => {
  const inputSchema = `
    type Call @model(queries: null, mutations: { delete: "testDelete" }) {
      senderId: ID! @index(name: "bySender", sortKeyFields: ["receiverId"])
      receiverId: ID! @primaryKey(sortKeyFields: ["senderId"])
    }

    input CreateCallInput {
      receiverId: ID!
    }

    input DeleteCallInput {
      receiverId: ID!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const DeleteCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput') as any;
  expect(DeleteCallInput).toBeDefined();
  const receiverIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdField).toBeDefined();
  expect(receiverIdField.type.kind).toBe('NonNullType');
  const senderIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdField).toBeDefined();
  expect(senderIdField.type.kind).toBe('NonNullType');
});

it('@model mutation with default', () => {
  const inputSchema = `
    type Call @model {
      senderId: ID! @index(name: "bySender", sortKeyFields: ["receiverId"])
      receiverId: ID! @primaryKey(sortKeyFields: ["senderId"])
    }

    input CreateCallInput {
      receiverId: ID!
    }

    input DeleteCallInput {
      receiverId: ID!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const DeleteCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput') as any;
  expect(DeleteCallInput).toBeDefined();
  const receiverIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdField).toBeDefined();
  expect(receiverIdField.type.kind).toBe('NonNullType');
  const senderIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdField).toBeDefined();
  expect(senderIdField.type.kind).toBe('NonNullType');

  const CreateCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateCallInput') as any;
  expect(CreateCallInput).toBeDefined();
  const receiverIdFieldCreate = CreateCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdFieldCreate).toBeDefined();
  expect(receiverIdFieldCreate.type.kind).toBe('NonNullType');
  const senderIdFieldCreate = CreateCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdFieldCreate).toBeUndefined();
});

it('@model mutation with queries', () => {
  const inputSchema = `
    type Call @model(queries: null) {
      senderId: ID! @index(name: "bySender", sortKeyFields: ["receiverId"])
      receiverId: ID! @primaryKey(sortKeyFields: ["senderId"])
    }

    input CreateCallInput {
      receiverId: ID!
    }

    input DeleteCallInput {
      receiverId: ID!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const DeleteCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'DeleteCallInput') as any;
  expect(DeleteCallInput).toBeDefined();
  const receiverIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdField).toBeDefined();
  expect(receiverIdField.type.kind).toBe('NonNullType');
  const senderIdField = DeleteCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdField).toBeDefined();
  expect(senderIdField.type.kind).toBe('NonNullType');

  const CreateCallInput = schema.definitions.find(d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'CreateCallInput') as any;
  expect(CreateCallInput).toBeDefined();
  const receiverIdFieldCreate = CreateCallInput.fields.find((f: any) => f.name.value === 'receiverId');
  expect(receiverIdFieldCreate).toBeDefined();
  expect(receiverIdFieldCreate.type.kind).toBe('NonNullType');
  const senderIdFieldCreate = CreateCallInput.fields.find((f: any) => f.name.value === 'senderId');
  expect(senderIdFieldCreate).toBeUndefined();
});

it('id field should be optional in updateInputObjects when it is not a primary key', () => {
  const inputSchema = /* GraphQL */ `
    type Review @model(subscriptions: { level: off }) {
      id: ID! @index(name: "byId", queryField: "listReviewsById")
      serviceId: ID! @index(name: "byService", sortKeyFields: ["createdAt"], queryField: "listReviewsByService")
      owner: String!
        @primaryKey(sortKeyFields: ["serviceId"])
        @index(name: "byStatus", sortKeyFields: ["status", "createdAt"], queryField: "listReviewsByStatus")
      rating: Int
      title: String
      status: String
      createdAt: AWSDateTime!
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const UpdateReviewInput = schema.definitions.find(
    d => d.kind === 'InputObjectTypeDefinition' && d.name.value === 'UpdateReviewInput',
  ) as any;
  expect(UpdateReviewInput).toBeDefined();
  const idField = UpdateReviewInput.fields.find((f: any) => f.name.value === 'id');
  expect(idField).toBeDefined();
  expect(idField.type.kind).toBe('NamedType');
});

test('GSI composite sort keys are wrapped in conditional to check presence in mutation', () => {
  const inputSchema = `
    type Person @model {
      id: ID! @primaryKey(sortKeyFields: ["firstName", "lastName"])
      firstName: String! @index(name: "byNameAndAge", sortKeyFields: ["age", "birthDate"], queryField: "getPersonByNameByDate")
                         @index(name: "byNameAndNickname", sortKeyFields: ["lastName", "nickname"])
      lastName: String!
      birthDate: AWSDate
      nickname: String
      age: Int
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);

  validateModelSchema(schema);
  expect(out.resolvers['Mutation.createPerson.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updatePerson.req.vtl']).toMatchSnapshot();
});

it('should support index/primary key with sync resolvers', () => {
  const validSchema = `
    type Item @model {
      orderId: ID! @primaryKey(sortKeyFields: ["status", "createdAt"])
      status: Status! @index(name: "ByStatus", sortKeyFields: ["createdAt"], queryField: "itemsByStatus")
      createdAt: AWSDateTime! @index(name: "ByCreatedAt", sortKeyFields: ["status"], queryField: "itemsByCreatedAt")
      name: String!
    }
    enum Status {
      DELIVERED IN_TRANSIT PENDING UNKNOWN
    }
  `;

  const config: SyncConfig = {
    ConflictDetection: 'VERSION',
    ConflictHandler: ConflictHandlerType.AUTOMERGE,
  };

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer()],
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

test('LSI creation regression test', () => {
  const inputSchema = `
    type Test @model {
      id: ID! @primaryKey
      index: ID! @index(name: "index1", sortKeyFields: ["id"])
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new PrimaryKeyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
});
