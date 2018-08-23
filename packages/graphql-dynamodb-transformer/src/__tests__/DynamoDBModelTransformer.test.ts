import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { DynamoDBModelTransformer } from '../DynamoDBModelTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test DynamoDBModelTransformer validation happy case', () => {
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
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
});

test('Test DynamoDBModelTransformer with query overrides', () => {
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
            new DynamoDBModelTransformer()
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

test('Test DynamoDBModelTransformer with mutation overrides', () => {
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
            new DynamoDBModelTransformer()
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

test('Test DynamoDBModelTransformer with only create mutations', () => {
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
            new DynamoDBModelTransformer()
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

test('Test DynamoDBModelTransformer with multiple model directives', () => {
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
            new DynamoDBModelTransformer()
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
    expectFields(queryType, ['listPosts'])
    expectFields(queryType, ['listUsers'])

    const stringInputType = getInputType(parsed, 'ModelStringFilterInput')
    expect(stringInputType).toBeDefined()
    const booleanInputType = getInputType(parsed, 'ModelBooleanFilterInput')
    expect(booleanInputType).toBeDefined()
    const intInputType = getInputType(parsed, 'ModelIntFilterInput')
    expect(intInputType).toBeDefined()
    const floatInputType = getInputType(parsed, 'ModelFloatFilterInput')
    expect(floatInputType).toBeDefined()
    const idInputType = getInputType(parsed, 'ModelIDFilterInput')
    expect(idInputType).toBeDefined()
    const postInputType = getInputType(parsed, 'ModelPostFilterInput')
    expect(postInputType).toBeDefined()
    const userInputType = getInputType(parsed, 'ModelUserFilterInput')
    expect(userInputType).toBeDefined()

    expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelUserFilterInput', 1)).toBeTruthy();
});

test('Test DynamoDBModelTransformer with filter', () => {
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
            new DynamoDBModelTransformer()
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
    expectFields(queryType, ['listPosts'])

    const connectionType = getObjectType(parsed, 'ModelPostConnection')
    expect(connectionType).toBeDefined()

    expect(verifyInputCount(parsed, 'ModelStringFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelBooleanFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIntFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelFloatFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelIDFilterInput', 1)).toBeTruthy();
    expect(verifyInputCount(parsed, 'ModelPostFilterInput', 1)).toBeTruthy();
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