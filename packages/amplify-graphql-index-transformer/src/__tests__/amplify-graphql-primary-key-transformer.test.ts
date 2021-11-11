import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { expect as cdkExpect, haveResourceLike } from '@aws-cdk/assert';
import { Kind, parse } from 'graphql';
import { PrimaryKeyTransformer } from '..';

test('throws if multiple primary keys are defined on an object', () => {
  const schema = `
    type Test @model {
      id: ID! @primaryKey
      email: String! @primaryKey
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`You may only supply one primary key on type 'Test'.`);
});

test('throws if partition key is nullable', () => {
  const schema = `
    type Test @model {
      id: ID @primaryKey
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The primary key on type 'Test' must reference non-null fields.`);
});

test('throws if sort key is nullable', () => {
  const schema = `
    type Test @model {
      id: ID @primaryKey(sortKeyFields: ["email"])
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The primary key on type 'Test' must reference non-null fields.`);
});

test('throws if @primaryKey is used in a non-@model type', () => {
  const schema = `
    type Test {
      id: ID! @primaryKey
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow('The @primaryKey directive may only be added to object definitions annotated with @model.');
});

test('throws if @primaryKey is used on a non-scalar field', () => {
  const schema = `
    type NonScalar {
      id: ID!
    }

    type Test @model {
      id: NonScalar! @primaryKey
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The primary key on type 'Test.id' cannot be a non-scalar.`);
});

test('throws if @primaryKey uses a sort key field that does not exist', () => {
  const schema = `
    type Test @model {
      id: ID! @primaryKey(sortKeyFields: ["doesnotexist"])
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`Can't find field 'doesnotexist' in Test, but it was specified in the primary key.`);
});

test('throws if @primaryKey uses a sort key field that is a non-scalar', () => {
  const schema = `
    type NonScalar {
      id: ID!
    }

    type Test @model {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      email: NonScalar
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The primary key's sort key on type 'Test.email' cannot be a non-scalar.`);
});

test('throws if @primaryKey refers to itself', () => {
  const schema = `
    type Test @model {
      id: ID! @primaryKey(sortKeyFields: ["id"])
      email: String
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`@primaryKey field 'id' cannot reference itself.`);
});

test('handles sortKeyFields being a string instead of an array', () => {
  const schema = `
    type NonScalar {
      id: ID!
    }

    type Test @model {
      id: ID! @primaryKey(sortKeyFields: "email")
      email: NonScalar
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  expect(() => {
    transformer.transform(schema);
  }).toThrow(`The primary key's sort key on type 'Test.email' cannot be a non-scalar.`);
});

test('a primary key with no sort key is properly configured', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType: any = schema.definitions.find((def: any) => def.name && def.name.value === 'Query');
  const getTestField: any = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField.arguments).toHaveLength(1);
  expect(getTestField.arguments[0].name.value).toEqual('email');

  // The auto-generated 'id' primary key should have been removed.
  const createInput: any = schema.definitions.find((d: any) => {
    return d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && d.name.value === 'CreateTestInput';
  });
  expect(createInput).toBeDefined();
  const defaultIdField = createInput.fields.find((f: any) => f.name.value === 'id');
  expect(defaultIdField).toBeUndefined();

  // This field should be created if it does not exist already.
  const sortDirectionEnum: any = schema.definitions.find((d: any) => {
    return d.kind === Kind.ENUM_TYPE_DEFINITION && d.name.value === 'ModelSortDirection';
  });
  expect(sortDirectionEnum).toBeDefined();
});

test('a primary key with a single sort key field is properly configured', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey(sortKeyFields: "kind")
      kind: Int!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'kind', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'kind', AttributeType: 'N' },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType: any = schema.definitions.find((def: any) => def.name && def.name.value === 'Query');
  const getTestField: any = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField.arguments).toHaveLength(2);
  expect(getTestField.arguments[0].name.value).toEqual('email');
  expect(getTestField.arguments[1].name.value).toEqual('kind');
});

test('a primary key with a composite sort key is properly configured', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey(sortKeyFields: ["kind", "other"])
      kind: Int!
      other: AWSDateTime!
      yetAnother: String
      andAnother: String!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' },
        { AttributeName: 'kind#other', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'kind#other', AttributeType: 'S' },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType: any = schema.definitions.find((def: any) => def.name && def.name.value === 'Query');
  const getTestField: any = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');

  expect(getTestField.arguments).toHaveLength(3);
  expect(getTestField.arguments[0].name.value).toEqual('email');
  expect(getTestField.arguments[1].name.value).toEqual('kind');
  expect(getTestField.arguments[2].name.value).toEqual('other');

  const listTestField: any = queryType.fields.find((f: any) => f.name && f.name.value === 'listTests');
  expect(listTestField.arguments).toHaveLength(6);
  expect(listTestField.arguments[0].name.value).toEqual('email');
  expect(listTestField.arguments[1].name.value).toEqual('kindOther');
  expect(listTestField.arguments[2].name.value).toEqual('filter');
  expect(listTestField.arguments[3].name.value).toEqual('limit');
  expect(listTestField.arguments[4].name.value).toEqual('nextToken');
  expect(listTestField.arguments[5].name.value).toEqual('sortDirection');

  const createInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput');
  const updateInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput');
  const deleteInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput');

  expect(createInput).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'other' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'yetAnother' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'andAnother' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'id')).toBeUndefined();
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'other' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'yetAnother' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'andAnother' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'id')).toBeUndefined();
  expect(deleteInput).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'other' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'yetAnother')).toBeUndefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'andAnother')).toBeUndefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'id')).toBeUndefined();
});

test('enums are supported in keys', () => {
  const inputSchema = `
    enum Status { DELIVERED IN_TRANSIT PENDING UNKNOWN }

    type Test @model {
      status: Status! @primaryKey(sortKeyFields: "lastStatus")
      lastStatus: Status!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'lastStatus', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'lastStatus', AttributeType: 'S' },
      ],
    }),
  );

  expect(out.resolvers).toMatchSnapshot();

  const queryType: any = schema.definitions.find((def: any) => def.name && def.name.value === 'Query');
  const getTestField: any = queryType.fields.find((f: any) => f.name && f.name.value === 'getTest');
  expect(getTestField.arguments).toHaveLength(2);
  expect(getTestField.arguments[0].name.value).toEqual('status');
  expect(getTestField.arguments[1].name.value).toEqual('lastStatus');
});

test('user provided id fields are not removed', () => {
  const inputSchema = `
    type Test @model {
      id: ID
      email: String! @primaryKey
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const stack = out.stacks.Test;

  validateModelSchema(schema);
  cdkExpect(stack).to(
    haveResourceLike('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
    }),
  );

  const createInput: any = schema.definitions.find((d: any) => {
    return d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && d.name.value === 'CreateTestInput';
  });
  expect(createInput).toBeDefined();
  const defaultIdField = createInput.fields.find((f: any) => f.name.value === 'id');
  expect(defaultIdField).toBeDefined();
});

test('null resolvers on @model are supported', () => {
  const inputSchema = `
    type Test @model(queries: null, mutations: null, subscriptions: null) {
      id: ID! @primaryKey
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const stack = out.stacks.Test;
  const definitions = schema.definitions.filter((d: any) => {
    return (
      (d.kind === Kind.OBJECT_TYPE_DEFINITION && ['Query', 'Mutation', 'Subscription'].includes(d.name.value)) ||
      (d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && ['CreateTestInput', 'UpdateTestInput', 'DeleteTestInput'].includes(d.name.value))
    );
  });

  expect(definitions).toEqual([]);
});

test('@model null resolvers can be overridden', () => {
  const inputSchema = `
    type Test @model(queries: null, mutations: null) {
      id: ID! @primaryKey
    }

    type Mutation {
      createTest(input: CreateTestInput!): Test
      deleteTest(input: DeleteTestInput!): Test
    }

    input CreateTestInput {
      id: ID!
    }

    input DeleteTestInput {
      id: ID!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const stack = out.stacks.Test;
  const definitions = schema.definitions
    .filter((d: any) => {
      return (
        (d.kind === Kind.OBJECT_TYPE_DEFINITION && ['Query', 'Mutation'].includes(d.name.value)) ||
        (d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && ['CreateTestInput', 'UpdateTestInput', 'DeleteTestInput'].includes(d.name.value))
      );
    })
    .map((d: any) => d.name.value);

  expect(definitions).toEqual(['Mutation', 'CreateTestInput', 'DeleteTestInput']);
});

test('resolvers can be renamed by @model', () => {
  const inputSchema = `
    type Test
    @model(
      queries: { get: "testGet", list: "testList" },
      mutations: { create: "testCreate", delete: "testDelete", update: "testUpdate" }
    ) {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      email: String!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const stack = out.stacks.Test;
  const query: any = schema.definitions.find((d: any) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === 'Query');
  const mutation: any = schema.definitions.find((d: any) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === 'Mutation');

  expect(out.resolvers).toMatchSnapshot();

  expect(query).toBeDefined();
  expect(query.fields.length).toEqual(2);
  expect(mutation).toBeDefined();
  expect(mutation.fields.length).toEqual(3);

  const getQuery = query.fields.find((f: any) => f.name.value === 'testGet');
  const listQuery = query.fields.find((f: any) => f.name.value === 'testList');
  const createMutation = mutation.fields.find((f: any) => f.name.value === 'testCreate');
  const updateMutation = mutation.fields.find((f: any) => f.name.value === 'testUpdate');
  const deleteMutation = mutation.fields.find((f: any) => f.name.value === 'testDelete');

  expect(getQuery).toBeDefined();
  expect(getQuery.arguments.length).toEqual(2);
  getQuery.arguments.forEach((arg: any) => expect(arg.type.kind).toEqual(Kind.NON_NULL_TYPE));

  expect(listQuery).toBeDefined();
  expect(listQuery.arguments.map((arg: any) => arg.name.value)).toEqual(['id', 'email', 'filter', 'limit', 'nextToken', 'sortDirection']);

  expect(createMutation).toBeDefined();
  expect(updateMutation).toBeDefined();
  expect(deleteMutation).toBeDefined();
});

test('individual resolvers can be made null by @model', () => {
  const inputSchema = `
    type Test @model(queries: { get: "testGet", list: null }) {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      email: String!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const stack = out.stacks.Test;
  const query: any = schema.definitions.find((d: any) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === 'Query');

  expect(out.resolvers).toMatchSnapshot();
  expect(query).toBeDefined();
  expect(query.fields.length).toEqual(1);
  const getQuery = query.fields.find((f: any) => f.name.value === 'testGet');
  expect(getQuery).toBeDefined();
});

it('id field should be optional in updateInputObjects when it is not a primary key', () => {
  const inputSchema = `
    type Review @model {
      id: ID!
      email: String!
      serviceId: ID!
      owner: String! @primaryKey(sortKeyFields: "serviceId")
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const updateReviewInput: any = schema.definitions.find(
    (d: any) => d.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && d.name.value === 'UpdateReviewInput',
  );
  expect(updateReviewInput).toBeDefined();
  const idField = updateReviewInput.fields.find((f: any) => f.name.value === 'id');
  expect(idField).toBeDefined();
  expect(idField.type.kind).toBe(Kind.NAMED_TYPE);
});

test('primary key with id as partition key is not required on createInput', () => {
  const inputSchema = `
    type Test @model {
      id: ID! @primaryKey(sortKeyFields: "kind")
      email: String!
      kind: Int!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const createInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput');
  const updateInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput');
  const deleteInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput');

  expect(createInput).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'kind' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'email')).toBeUndefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
});

test('primary key with id and createdAt is not required on createInput', () => {
  const inputSchema = `
    type Test @model {
      id: ID! @primaryKey(sortKeyFields: "createdAt")
      email: String!
      createdAt: AWSDateTime!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const createInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput');
  const updateInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput');
  const deleteInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput');

  expect(createInput).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'createdAt' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'createdAt' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NAMED_TYPE)).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'createdAt' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'email')).toBeUndefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'id' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
});

test('key with complex fields updates the input objects', () => {
  const inputSchema = `
    type Test @model {
      email: String! @primaryKey
      nonNullListInputOfNonNullStrings: [String!]!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);

  validateModelSchema(schema);

  const createInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput');
  const updateInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput');
  const deleteInput: any = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput');

  expect(createInput).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(
    createInput.fields.find((f: any) => {
      return (
        f.name.value === 'nonNullListInputOfNonNullStrings' &&
        f.type.kind === Kind.NON_NULL_TYPE &&
        f.type.type.kind === Kind.LIST_TYPE &&
        f.type.type.type.kind === Kind.NON_NULL_TYPE
      );
    }),
  ).toBeDefined();
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(
    updateInput.fields.find((f: any) => {
      return (
        f.name.value === 'nonNullListInputOfNonNullStrings' && f.type.kind === Kind.LIST_TYPE && f.type.type.kind === Kind.NON_NULL_TYPE
      );
    }),
  ).toBeDefined();
  expect(deleteInput).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'email' && f.type.kind === Kind.NON_NULL_TYPE)).toBeDefined();
  expect(deleteInput.fields.find((f: any) => f.name.value === 'nonNullListInputOfNonNullStrings')).toBeUndefined();
});

test('list queries use correct pluralization', () => {
  const inputSchema = `
    type Boss @model {
      id: ID! @primaryKey
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer()],
  });
  const out = transformer.transform(inputSchema);
  const schema = parse(out.schema);
  const query: any = schema.definitions.find((d: any) => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === 'Query');
  expect(query).toBeDefined();

  const listQuery = query.fields.find((f: any) => f.name.value === 'listBosses');
  expect(listQuery).toBeDefined();

  expect(out.resolvers['Query.listBosses.req.vtl']).toBeDefined();
  expect(out.resolvers['Query.listBosses.res.vtl']).toBeDefined();
});
