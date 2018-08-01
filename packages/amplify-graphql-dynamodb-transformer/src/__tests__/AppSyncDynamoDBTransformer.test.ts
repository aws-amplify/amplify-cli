import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'amplify-graphql-transform'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from '../AppSyncDynamoDBTransformer'
import AppSyncTransformer from 'amplify-graphql-appsync-transformer'

test('Test AppSyncDynamoDBTransformer validation happy case', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
});

test('Test AppSyncDynamoDBTransformer with query overrides', () => {
    const validSchema = `type Post @model(queries: { get: "customGetPost", list: "customListPost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query')
    expect(queryType).toBeDefined()
    expectFields(queryType, ['customGetPost'])
    expectFields(queryType, ['customListPost'])
});

test('Test AppSyncDynamoDBTransformer with mutation overrides', () => {
    const validSchema = `type Post @model(mutations: { create: "customCreatePost", update: "customUpdatePost", delete: "customDeletePost" }) { 
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const mutationType = getObjectType(parsed, 'Mutation')
    expect(mutationType).toBeDefined()
    expectFields(mutationType, ['customCreatePost', 'customUpdatePost', 'customDeletePost'])
});

test('Test AppSyncDynamoDBTransformer with only create mutations', () => {
    const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) { 
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const mutationType = getObjectType(parsed, 'Mutation')
    expect(mutationType).toBeDefined()
    expectFields(mutationType, ['customCreatePost'])
    doNotExpectFields(mutationType, ['updatePost'])
});

test('Test AppSyncDynamoDBTransformer with multiple model directives', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }

    type User @model {
        id: ID!
        name: String!
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()

    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query')
    expect(queryType).toBeDefined()
    expectFields(queryType, ['listPost'])
    expectFields(queryType, ['listUser'])

    const stringInputType = getInputType(parsed, 'TableStringFilterInput')
    expect(stringInputType).toBeDefined()
    const booleanInputType = getInputType(parsed, 'TableBooleanFilterInput')
    expect(booleanInputType).toBeDefined()
    const intInputType = getInputType(parsed, 'TableIntFilterInput')
    expect(intInputType).toBeDefined()
    const floatInputType = getInputType(parsed, 'TableFloatFilterInput')
    expect(floatInputType).toBeDefined()
    const idInputType = getInputType(parsed, 'TableIDFilterInput')
    expect(idInputType).toBeDefined()
    const postInputType = getInputType(parsed, 'TablePostFilterInput')
    expect(postInputType).toBeDefined()
    const userInputType = getInputType(parsed, 'TableUserFilterInput')
    expect(userInputType).toBeDefined()

    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy();
});

test('Test AppSyncDynamoDBTransformer with filter', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()

    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query')
    expect(queryType).toBeDefined()
    expectFields(queryType, ['listPost'])

    const connectionType = getObjectType(parsed, 'TablePostConnection')
    expect(connectionType).toBeDefined()

    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy();
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        expect(
            type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        ).toBeUndefined()
    }
}

function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as ObjectTypeDefinitionNode | undefined
}

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as InputObjectTypeDefinitionNode | undefined
}

function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
    return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
}