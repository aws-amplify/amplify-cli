import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import { AppSyncDynamoDBTransformer } from '../AppSyncDynamoDBTransformer'
import { ResourceFactory } from '../resources'

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
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
});

test('Test AppSyncDynamoDBTransformer with query overrides', () => {
    const validSchema = `type Post @model(queries: { get: "customGetPost" }) { 
        id: ID! 
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceFactory.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema['Properties']['Definition']
    expect(definition).toBeDefined
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query')
    expect(queryType).toBeDefined()
    expectFields(queryType, ['customGetPost'])
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
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceFactory.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema['Properties']['Definition']
    expect(definition).toBeDefined
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
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceFactory.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema['Properties']['Definition']
    expect(definition).toBeDefined
    const parsed = parse(definition);
    const mutationType = getObjectType(parsed, 'Mutation')
    expect(mutationType).toBeDefined()
    expectFields(mutationType, ['customCreatePost'])
    doNotExpectFields(mutationType, ['updatePost'])
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName in fields) {
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
