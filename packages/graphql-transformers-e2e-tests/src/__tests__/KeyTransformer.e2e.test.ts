import GraphQLTransform, { Transformer, InvalidDirectiveError } from 'graphql-transformer-core'
import ModelTransformer from 'graphql-dynamodb-transformer';
import KeyTransformer from 'graphql-key-transformer';
import { parse, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { expectArguments } from '../testUtil';

test('Test that a primary @key with a single field changes the hash key.', () => {
    const validSchema = `
    type Test @model @key(fields: ["email"]) {
        email: String!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new ModelTransformer(),
            new KeyTransformer()
        ]
    });

    const out = transformer.transform(validSchema);
    let tableResource = out.stacks.Test.Resources.TestTable;
    expect(tableResource).toBeDefined()
    expect(
        tableResource.Properties.KeySchema[0].AttributeName,
    ).toEqual('email');
    expect(
        tableResource.Properties.KeySchema[0].KeyType,
    ).toEqual('HASH');
    expect(
        tableResource.Properties.AttributeDefinitions[0].AttributeType,
    ).toEqual('S');
    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getTestField = queryType.fields.find(f => f.name && f.name.value === 'getTest') as FieldDefinitionNode;
    expect(getTestField.arguments).toHaveLength(1);
    expectArguments(getTestField, ['email'])
})

test('Test that a primary @key with 2 fields changes the hash and sort key.', () => {
    const validSchema = `
    type Test @model @key(fields: ["email", "kind"]) {
        email: String!
        kind: Int!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new ModelTransformer(),
            new KeyTransformer()
        ]
    });

    const out = transformer.transform(validSchema);
    let tableResource = out.stacks.Test.Resources.TestTable;
    expect(tableResource).toBeDefined()
    const hashKey = tableResource.Properties.KeySchema.find(o => o.KeyType === 'HASH');
    const hashKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'email');
    const rangeKey = tableResource.Properties.KeySchema.find(o => o.KeyType === 'RANGE');
    const rangeKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'kind');
    expect(tableResource.Properties.AttributeDefinitions).toHaveLength(2);
    expect(hashKey.AttributeName).toEqual('email');
    expect(rangeKey.AttributeName).toEqual('kind');
    expect(hashKeyAttr.AttributeType).toEqual('S');
    expect(rangeKeyAttr.AttributeType).toEqual('N');

    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getTestField = queryType.fields.find(f => f.name && f.name.value === 'getTest') as FieldDefinitionNode;
    expect(getTestField.arguments).toHaveLength(2);
    expectArguments(getTestField, ['email', 'kind'])
})

test('Test that a primary @key with 3 fields changes the hash and sort keys.', () => {
    const validSchema = `
    type Test @model @key(fields: ["email", "kind", "date"]) {
        email: String!
        kind: Int!
        date: AWSDateTime!
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new ModelTransformer(),
            new KeyTransformer()
        ]
    });

    const out = transformer.transform(validSchema);
    let tableResource = out.stacks.Test.Resources.TestTable;
    expect(tableResource).toBeDefined()
    const hashKey = tableResource.Properties.KeySchema.find(o => o.KeyType === 'HASH');
    const hashKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'email');
    const rangeKey = tableResource.Properties.KeySchema.find(o => o.KeyType === 'RANGE');
    const rangeKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'kindDate');
    expect(tableResource.Properties.AttributeDefinitions).toHaveLength(2);
    expect(hashKey.AttributeName).toEqual('email');
    expect(rangeKey.AttributeName).toEqual('kindDate');
    expect(hashKeyAttr.AttributeType).toEqual('S');
    // composite keys will always be strings.
    expect(rangeKeyAttr.AttributeType).toEqual('S');

    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getTestField = queryType.fields.find(f => f.name && f.name.value === 'getTest') as FieldDefinitionNode;
    expect(getTestField.arguments).toHaveLength(3);
    expectArguments(getTestField, ['email', 'kind', 'date'])
})
