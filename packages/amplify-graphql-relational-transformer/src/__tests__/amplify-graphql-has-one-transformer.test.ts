import { PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { Kind, parse } from 'graphql';
import { HasOneTransformer } from '..';

test('fails if @hasOne was used on an object that is not a model type', () => {
  const inputSchema = `
    type Test {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`@hasOne must be on an @model object type field.`);
});

test('fails if @hasOne was used with a related type that is not a model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: "email")
    }

    type Test1 {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`Object type Test1 must be annotated with @model.`);
});

test('fails if the related type does not exist', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test2 @hasOne(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('Unknown type "Test2". Did you mean "Test" or "Test1"?');
});

test('fails if an empty list of fields is passed in', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: Test1 @hasOne(fields: [])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('No fields passed to @hasOne directive.');
});

test('fails if any of the fields passed in are not in the parent model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: Test1 @hasOne(fields: ["id", "name"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('name is not a field in Test');
});

test('fails if @hasOne field does not match related type primary key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if sort key type does not match related type sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: "friendID")
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if partial sort key is provided', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(
    'Invalid @hasOne directive on testObj. Partial sort keys are not accepted.',
  );
});

test('accepts @hasOne without a sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasOne(fields: ["id"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).not.toThrowError();
});

test('fails if used as a has many relation', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @hasOne
    }

    type Test1 @model {
      id: ID! @primaryKey
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('@hasOne cannot be used with lists. Use @hasMany instead.');
});

test('fails if object type fields are provided', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      objField: Test1
      testObj: Test1 @hasOne(fields: ["objField"])
    }

    type Test1 @model {
      id: ID! @primaryKey
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('All fields provided to @hasOne must be scalar or enum fields.');
});

test('creates has one relationship with explicit fields', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      otherHalf: Test1 @hasOne(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      friendID: ID!
      email: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();
  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherHalf');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  const createInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput') as any;
  expect(createInput).toBeDefined();
  expect(createInput.fields.length).toEqual(2);
  expect(createInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();

  const updateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput') as any;
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.length).toEqual(2);
  expect(updateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
});

test('creates has one relationship with implicit fields', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      otherHalf: Test1 @hasOne
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      friendID: ID!
      email: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();
  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherHalf');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  const createInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput') as any;
  expect(createInput).toBeDefined();
  expect(createInput.fields.length).toEqual(3);
  expect(createInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'testOtherHalfId')).toBeDefined();

  const updateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput') as any;
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.length).toEqual(3);
  expect(updateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'testOtherHalfId')).toBeDefined();
});

test('creates has one relationship with composite sort key.', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      name: String!
      otherHalf: Test1 @hasOne(fields: ["id", "email", "name"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email", "name"])
      friendID: ID!
      email: String!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();
  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherHalf');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  const createInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput') as any;
  expect(createInput).toBeDefined();
  expect(createInput.fields.length).toEqual(3);
  expect(createInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(createInput.fields.find((f: any) => f.name.value === 'name')).toBeDefined();

  const updateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput') as any;
  expect(updateInput).toBeDefined();
  expect(updateInput.fields.length).toEqual(3);
  expect(updateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(updateInput.fields.find((f: any) => f.name.value === 'name')).toBeDefined();
});
