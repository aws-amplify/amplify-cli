import { parse, InputObjectTypeDefinitionNode, DefinitionNode, DocumentNode, Kind } from 'graphql';
import { GraphQLTransform, InvalidDirectiveError, SyncConfig, ConflictHandlerType } from 'graphql-transformer-core';
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

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}
