import { GraphQLTransform, InvalidDirectiveError } from 'graphql-transformer-core';
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
