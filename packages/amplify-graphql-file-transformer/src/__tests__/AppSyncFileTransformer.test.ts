import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'amplify-graphql-transform'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from 'amplify-graphql-dynamodb-transformer'
import { AppSyncFileTransformer } from '../AppSyncFileTransformer'

test('Test AppSyncFileTransformer validation happy case', () => {
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
            new AppSyncFileTransformer(),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
});

test('Test AppSyncFileTransformer with multiple model directives', () => {
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
            new AppSyncFileTransformer(),
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
    expectFields(queryType, ['queryPost'])
    expectFields(queryType, ['listUser'])
    expectFields(queryType, ['queryUser'])
    
    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy;
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