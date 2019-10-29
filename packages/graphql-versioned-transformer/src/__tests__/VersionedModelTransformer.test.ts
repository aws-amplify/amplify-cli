import { ObjectTypeDefinitionNode, parse, DocumentNode, Kind, InputObjectTypeDefinitionNode } from 'graphql';
import { GraphQLTransform } from 'graphql-transformer-core';
import { VersionedModelTransformer } from '../VersionedModelTransformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';

const getInputType = (schemaDoc: DocumentNode) => (name: string): InputObjectTypeDefinitionNode =>
  schemaDoc.definitions.find(d => (d.kind !== Kind.SCHEMA_DEFINITION ? d.name.value === name : false)) as InputObjectTypeDefinitionNode;
const getInputField = (input: InputObjectTypeDefinitionNode, field: string) => input.fields.find(f => f.name.value === field);
const getType = (schemaDoc: DocumentNode) => (name: string): ObjectTypeDefinitionNode =>
  schemaDoc.definitions.find(d => (d.kind !== Kind.SCHEMA_DEFINITION ? d.name.value === name : false)) as ObjectTypeDefinitionNode;
const getField = (input: ObjectTypeDefinitionNode, field: string) => input.fields.find(f => f.name.value === field);

test('Test VersionedModelTransformer validation happy case', () => {
  const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new VersionedModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  // tslint:disable-next-line
  const schemaDoc = parse(out.schema);

  expect(out).toBeDefined();
  expect(getField(getType(schemaDoc)('Post'), 'version')).toBeDefined();
  expect(getInputField(getInputType(schemaDoc)('CreatePostInput'), 'version')).toBeUndefined();
  expect(getInputField(getInputType(schemaDoc)('UpdatePostInput'), 'expectedVersion')).toBeDefined();
  expect(getInputField(getInputType(schemaDoc)('DeletePostInput'), 'expectedVersion')).toBeDefined();
  // Use e2e tests to test resolver logic.
});

test('Test VersionedModelTransformer validation fails when provided version field of wrong type.', () => {
  const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: String!
        createdAt: String
        updatedAt: String
    }
    `;
  try {
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new VersionedModelTransformer()],
    });
    const out = transformer.transform(validSchema);
  } catch (e) {
    expect(e.name).toEqual('TransformerContractError');
  }
});

test('Test VersionedModelTransformer version field replaced by non-null if provided as nullable.', () => {
  const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: Int
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new VersionedModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  const sdl = out.schema;
  const schemaDoc = parse(sdl);
  const versionField = getField(getType(schemaDoc)('Post'), 'version');
  expect(versionField).toBeDefined();
  expect(versionField.type.kind).toEqual(Kind.NON_NULL_TYPE);
});
