import { PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { Kind, parse } from 'graphql';
import { BelongsToTransformer, HasOneTransformer } from '..';

test('fails if @belongsTo was used on an object that is not a model type', () => {
  const inputSchema = `
    type Test {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`@belongsTo must be on an @model object type field.`);
});

test('fails if @belongsTo was used with a related type that is not a model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: "email")
    }

    type Test1 {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`Object type Test1 must be annotated with @model.`);
});

test('fails if the related type does not exist', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test2 @belongsTo(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('Unknown type "Test2". Did you mean "Test" or "Test1"?');
});

test('fails if an empty list of fields is passed in', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: Test1 @belongsTo(fields: [])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('No fields passed to @belongsTo directive.');
});

test('fails if any of the fields passed in are not in the parent model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: Test1 @belongsTo(fields: ["id", "name"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('name is not a field in Test');
});

test('fails if @belongsTo field does not match related type primary key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      friendID: ID!
      name: String!
      test: Test @hasOne
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if sort key type does not match related type sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: "friendID")
      friendID: ID!
      name: String!
      test: Test @hasOne
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if partial sort key is provided', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
      test: Test @hasOne
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(
    'Invalid @belongsTo directive on testObj. Partial sort keys are not accepted.',
  );
});

test('accepts @belongsTo without a sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @belongsTo(fields: ["id"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
      test: Test @hasOne
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).not.toThrowError();
});

test('fails if used on a list field', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @belongsTo
    }

    type Test1 @model {
      id: ID! @primaryKey
      name: String!
      test: Test @hasOne
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('@belongsTo cannot be used with lists.');
});

test('fails if object type fields are provided', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      objField: Test1
      testObj: Test1 @belongsTo(fields: ["objField"])
    }

    type Test1 @model {
      id: ID! @primaryKey
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('All fields provided to @belongsTo must be scalar or enum fields.');
});

test('fails if a bidirectional relationship does not exist', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1
    }

    type Test1 @model {
      id: ID!
      name: String!
      owner: Test @belongsTo
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new BelongsToTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('Test must have a relationship with Test1 in order to use @belongsTo.');
});

test('creates belongs to relationship with implicit fields', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      otherHalf: Test1 @hasOne
    }

    type Test1 @model {
      id: ID!
      friendID: ID!
      email: String!
      otherHalf2: Test @belongsTo
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const test1ObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test1') as any;
  expect(test1ObjType).toBeDefined();
  const relatedField = test1ObjType.fields.find((f: any) => f.name.value === 'otherHalf2');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);

  const create1Input = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTest1Input') as any;
  expect(create1Input).toBeDefined();
  expect(create1Input.fields.length).toEqual(4);
  expect(create1Input.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(create1Input.fields.find((f: any) => f.name.value === 'friendID')).toBeDefined();
  expect(create1Input.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(create1Input.fields.find((f: any) => f.name.value === 'test1OtherHalf2Id')).toBeDefined();

  const update1Input = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTest1Input') as any;
  expect(update1Input).toBeDefined();
  expect(update1Input.fields.length).toEqual(4);
  expect(update1Input.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(update1Input.fields.find((f: any) => f.name.value === 'friendID')).toBeDefined();
  expect(update1Input.fields.find((f: any) => f.name.value === 'email')).toBeDefined();
  expect(update1Input.fields.find((f: any) => f.name.value === 'test1OtherHalf2Id')).toBeDefined();

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

test('regression test for implicit id field on related type', () => {
  const inputSchema = `
    type BatteryCharger @model {
      powerSourceID: ID
      powerSource: PowerSource @hasOne(fields: ["powerSourceID"])
    }

    type PowerSource @model {
      sourceID: ID!
      chargerID: ID
      charger: BatteryCharger @belongsTo(fields: ["chargerID"])
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer(), new BelongsToTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
});
