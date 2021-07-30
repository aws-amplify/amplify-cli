import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { getFieldOnObjectType, getObjectType } from './test-utils/helpers';

describe('createdAt field tests', () => {
  it('should return createdAt when there is no timestamps configuration', () => {
    const doc = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'createdAt');

    expect(postModelField).toBeDefined();
  });

  it('should return null when timestamps are set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: null) {
        id: ID!
        title: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'createdAt');

    expect(postModelField).toBeUndefined();
  });

  it('should return null when createdAt is set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: null }) {
        id: ID!
        title: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'createdAt');

    expect(postModelField).toBeUndefined();
  });

  it('should return createdOn when createdAt is set to createdOn', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: "createdOn" }) {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'createdOn');

    expect(postModelField).toBeDefined();
  });

  it('should return createdAt when createdAt is not set in timestamps', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: "updatedOn" }) {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'createdAt');

    expect(postModelField).toBeDefined();
  });
});

describe('updatedAt field tests', () => {
  it('should return updatedAt when there is no timestamps configuration', () => {
    const doc = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'updatedAt');

    expect(postModelField).toBeDefined();
  });

  it('should return null for updatedAt when timestamps are set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: null) {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'updatedAt');

    expect(postModelField).toBeUndefined();
  });

  it('should return null when updatedAt is set to null', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: null }) {
        id: ID!
        title: String
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });

    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'updatedAt');

    expect(postModelField).toBeUndefined();
  });

  it('should return updatedOn when updatedAt is set to updatedOn', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { updatedAt: "updatedOn" }) {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'updatedOn');

    expect(postModelField).toBeDefined();
  });

  it('should return updatedAt when updatedAt is not set in timestamps', () => {
    const doc = /* GraphQL */ `
      type Post @model(timestamps: { createdAt: "createdOnOn" }) {
        id: ID!
        title: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer()],
    });
    const out = transformer.transform(doc);
    expect(out).toBeDefined();

    const definition = out.schema;
    expect(definition).toBeDefined();

    const parsed = parse(definition);
    validateModelSchema(parsed);
    const postModelObject = getObjectType(parsed, 'Post');
    const postModelField = getFieldOnObjectType(postModelObject!, 'updatedAt');

    expect(postModelField).toBeDefined();
  });
});
