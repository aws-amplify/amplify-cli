import GraphQLTransform, { Transformer, InvalidDirectiveError } from 'graphql-transformer-core'
import ModelTransformer from 'graphql-dynamodb-transformer';
import KeyTransformer from 'graphql-key-transformer';
import { parse, FieldDefinitionNode, ObjectTypeDefinitionNode,
    Kind, InputObjectTypeDefinitionNode } from 'graphql';
import { expectArguments, expectNonNullFields, expectNullableFields,
    expectNonNullInputValues, expectNullableInputValues, expectInputValueToHandle  } from '../testUtil';

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
    const rangeKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'kind#date');
    expect(tableResource.Properties.AttributeDefinitions).toHaveLength(2);
    expect(hashKey.AttributeName).toEqual('email');
    expect(rangeKey.AttributeName).toEqual('kind#date');
    expect(hashKeyAttr.AttributeType).toEqual('S');
    // composite keys will always be strings.
    expect(rangeKeyAttr.AttributeType).toEqual('S');

    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getTestField = queryType.fields.find(f => f.name && f.name.value === 'getTest') as FieldDefinitionNode;
    expect(getTestField.arguments).toHaveLength(3);
    expectArguments(getTestField, ['email', 'kind', 'date']);

    const listTestField = queryType.fields.find(f => f.name && f.name.value === 'listTests') as FieldDefinitionNode;
    expect(listTestField.arguments).toHaveLength(6);
    expectArguments(listTestField, ['email', 'kindDate', 'filter', 'nextToken', 'limit', 'sortDirection']);
})

test('Test that a secondary @key with 3 fields changes the hash and sort keys and adds a query fields correctly.', () => {
    const validSchema = `
    type Test @model @key(name: "GSI", fields: ["email", "kind", "date"], queryField: "listByEmailKindDate") {
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
    console.log(out.schema);
    let tableResource = out.stacks.Test.Resources.TestTable;
    expect(tableResource).toBeDefined()
    const hashKey = tableResource.Properties.KeySchema.find(o => o.KeyType === 'HASH');
    const hashKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'email');
    expect(tableResource.Properties.AttributeDefinitions).toHaveLength(3);
    expect(hashKey.AttributeName).toEqual('id');
    expect(hashKeyAttr.AttributeType).toEqual('S');
    // composite keys will always be strings.

    const gsi = tableResource.Properties.GlobalSecondaryIndexes.find(o => o.IndexName === 'GSI')
    const gsiHashKey = gsi.KeySchema.find(o => o.KeyType === 'HASH');
    const gsiHashKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'email');
    const gsiRangeKey = gsi.KeySchema.find(o => o.KeyType === 'RANGE');
    const gsiRangeKeyAttr = tableResource.Properties.AttributeDefinitions.find(o => o.AttributeName === 'kind#date');
    expect(gsiHashKey.AttributeName).toEqual('email');
    expect(gsiRangeKey.AttributeName).toEqual('kind#date');
    expect(gsiHashKeyAttr.AttributeType).toEqual('S');
    expect(gsiRangeKeyAttr.AttributeType).toEqual('S');

    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getTestField = queryType.fields.find(f => f.name && f.name.value === 'getTest') as FieldDefinitionNode;
    expect(getTestField.arguments).toHaveLength(1);
    expectArguments(getTestField, ['id']);

    const queryField = queryType.fields.find(f => f.name && f.name.value === 'listByEmailKindDate') as FieldDefinitionNode;
    expect(queryField.arguments).toHaveLength(6);
    expectArguments(queryField, ['email', 'kindDate', 'filter', 'nextToken', 'limit', 'sortDirection']);

    const listTestField = queryType.fields.find(f => f.name && f.name.value === 'listTests') as FieldDefinitionNode;
    expect(listTestField.arguments).toHaveLength(3);
    expectArguments(listTestField, ['filter', 'nextToken', 'limit']);
})

test('Test that a secondary @key with a single field adds a GSI.', () => {
    const validSchema = `
    type Test @model @key(name: "GSI_Email", fields: ["email"], queryField: "testsByEmail") {
        id: ID!
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
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[0].AttributeName,
    ).toEqual('email');
    expect(
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[0].KeyType,
    ).toEqual('HASH');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'email').AttributeType,
    ).toEqual('S');
    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const getField = queryType.fields.find(f => f.name.value === 'getTest');
    expect(getField.arguments).toHaveLength(1);
    expectArguments(getField, ['id'])
    const listTestsField = queryType.fields.find(f => f.name && f.name.value === 'listTests') as FieldDefinitionNode;
    expect(listTestsField.arguments).toHaveLength(3);
    expectArguments(listTestsField, ['filter', 'nextToken', 'limit']);
    const queryIndexField = queryType.fields.find(f => f.name && f.name.value === 'testsByEmail') as FieldDefinitionNode;
    expect(queryIndexField.arguments).toHaveLength(5);
    expectArguments(queryIndexField, ['email', 'filter', 'nextToken', 'limit', 'sortDirection']);
})

test('Test that a secondary @key with a multiple field adds an GSI.', () => {
    const validSchema = `
    type Test @model @key(fields: ["email", "createdAt"])
    @key(name: "CategoryGSI", fields: ["category", "createdAt"], queryField: "testsByCategory") {
        email: String!
        createdAt: String!
        category: String!
        description: String
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
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[0].AttributeName,
    ).toEqual('category');
    expect(
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[0].KeyType,
    ).toEqual('HASH');
    expect(
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[1].AttributeName,
    ).toEqual('createdAt');
    expect(
        tableResource.Properties.GlobalSecondaryIndexes[0].KeySchema[1].KeyType,
    ).toEqual('RANGE');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'email').AttributeType,
    ).toEqual('S');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'category').AttributeType,
    ).toEqual('S');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'createdAt').AttributeType,
    ).toEqual('S');
    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const queryIndexField = queryType.fields.find(f => f.name && f.name.value === 'testsByCategory') as FieldDefinitionNode;
    expect(queryIndexField.arguments).toHaveLength(6);
    expectArguments(queryIndexField, ['category', 'createdAt', 'filter', 'nextToken', 'limit', 'sortDirection']);

    // When using a complex primary key args are added to the list field. They are optional and if provided, will use a Query instead of a Scan.
    const listTestsField = queryType.fields.find(f => f.name && f.name.value === 'listTests') as FieldDefinitionNode;
    expect(listTestsField.arguments).toHaveLength(6);
    expectArguments(listTestsField, ['email', 'createdAt', 'filter', 'nextToken', 'limit', 'sortDirection']);

    // Check the create, update, delete inputs.
    const createInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput') as ObjectTypeDefinitionNode;
    expectNonNullFields(createInput, ['email', 'createdAt', 'category']);
    expectNullableFields(createInput, ['description']);
    expect(createInput.fields).toHaveLength(4);
    const updateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput') as ObjectTypeDefinitionNode;
    expectNonNullFields(updateInput, ['email', 'createdAt']);
    expectNullableFields(updateInput, ['category', 'description']);
    expect(updateInput.fields).toHaveLength(4);
    const deleteInput = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput') as ObjectTypeDefinitionNode;
    expectNonNullFields(deleteInput, ['email', 'createdAt']);
    expect(deleteInput.fields).toHaveLength(2);
})


test('Test that a secondary @key with a multiple field adds an LSI.', () => {
    const validSchema = `
    type Test 
        @model @key(fields: ["email", "createdAt"]) 
        @key(name: "GSI_Email_UpdatedAt", fields: ["email", "updatedAt"], queryField: "testsByEmailByUpdatedAt") {
        email: String!
        createdAt: String!
        updatedAt: String!
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
        tableResource.Properties.LocalSecondaryIndexes[0].KeySchema[0].AttributeName,
    ).toEqual('email');
    expect(
        tableResource.Properties.LocalSecondaryIndexes[0].KeySchema[0].KeyType,
    ).toEqual('HASH');
    expect(
        tableResource.Properties.LocalSecondaryIndexes[0].KeySchema[1].AttributeName,
    ).toEqual('updatedAt');
    expect(
        tableResource.Properties.LocalSecondaryIndexes[0].KeySchema[1].KeyType,
    ).toEqual('RANGE');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'email').AttributeType,
    ).toEqual('S');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'updatedAt').AttributeType,
    ).toEqual('S');
    expect(
        tableResource.Properties.AttributeDefinitions.find(ad => ad.AttributeName === 'createdAt').AttributeType,
    ).toEqual('S');
    const schema = parse(out.schema);
    const queryType = schema.definitions.find((def: any) => def.name && def.name.value === 'Query') as ObjectTypeDefinitionNode;
    const queryIndexField = queryType.fields.find(f => f.name && f.name.value === 'testsByEmailByUpdatedAt') as FieldDefinitionNode;
    expect(queryIndexField.arguments).toHaveLength(6);
    expectArguments(queryIndexField, ['email', 'updatedAt', 'filter', 'nextToken', 'limit', 'sortDirection']);

    // When using a complex primary key args are added to the list field. They are optional and if provided, will use a Query instead of a Scan.
    const listTestsField = queryType.fields.find(f => f.name && f.name.value === 'listTests') as FieldDefinitionNode;
    expect(listTestsField.arguments).toHaveLength(6);
    expectArguments(listTestsField, ['email', 'createdAt', 'filter', 'nextToken', 'limit', 'sortDirection']);
})

test('Test that a primary @key with complex fields will update the input objects.', () => {
    const validSchema = `
    type Test @model @key(fields: ["email"]) {
        email: String!
        listInput: [String]
        nonNullListInput: [String]!
        nonNullListInputOfNonNullStrings: [String!]!
    }
    `;

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
    const createInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateTestInput') as InputObjectTypeDefinitionNode;
    const updateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateTestInput') as InputObjectTypeDefinitionNode;
    const deleteInput = schema.definitions.find((def: any) => def.name && def.name.value === 'DeleteTestInput') as InputObjectTypeDefinitionNode;
    expect(createInput).toBeDefined();
    expectNonNullInputValues(createInput, ['email', 'nonNullListInput', 'nonNullListInputOfNonNullStrings']);
    expectNullableInputValues(createInput, ['listInput']);
    expectInputValueToHandle(createInput, (f: any) => {
        if (f.name.value === 'nonNullListInputOfNonNullStrings') {
            return f.type.kind === Kind.NON_NULL_TYPE && f.type.type.kind === Kind.LIST_TYPE && f.type.type.type.kind === Kind.NON_NULL_TYPE;
        } else if (f.name.value === 'nonNullListInput') {
            return f.type.kind === Kind.NON_NULL_TYPE && f.type.type.kind === Kind.LIST_TYPE;
        } else if (f.name.value === 'listInput') {
            return f.type.kind === Kind.LIST_TYPE;
        }
        return true;
    });

    expectNonNullInputValues(updateInput, ['email']);
    expectNullableInputValues(updateInput, ['listInput', 'nonNullListInput', 'nonNullListInputOfNonNullStrings']);
    expectInputValueToHandle(updateInput, (f: any) => {
        if (f.name.value === 'nonNullListInputOfNonNullStrings') {
            return f.type.kind === Kind.LIST_TYPE && f.type.type.kind === Kind.NON_NULL_TYPE;
        } else if (f.name.value === 'nonNullListInput') {
            return f.type.kind === Kind.LIST_TYPE;
        } else if (f.name.value === 'listInput') {
            return f.type.kind === Kind.LIST_TYPE;
        }
        return true;
    });

    expectNonNullInputValues(deleteInput, ['email']);
})