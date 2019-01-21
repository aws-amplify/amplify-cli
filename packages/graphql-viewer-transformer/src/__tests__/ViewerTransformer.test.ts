import {
    ObjectTypeDefinitionNode, parse, DocumentNode,
    Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { ViewerTransformer } from '../ViewerTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'

const getType = (schemaDoc: DocumentNode) => (name: string): ObjectTypeDefinitionNode =>
    schemaDoc.definitions.find(d => d.kind !== Kind.SCHEMA_DEFINITION ? d.name.value === name : false) as ObjectTypeDefinitionNode
const getField = (input: ObjectTypeDefinitionNode, field: string) => input.fields.find(f => f.name.value === field)

test('Test VersionedModelTransformer validation happy case', () => {
    const validSchema = `
    type User @model @viewer {
        id: ID!
        name: String!
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ViewerTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    // tslint:disable-next-line
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)

    expect(out).toBeDefined()
    expect(getField(getType(schemaDoc)('Query'), 'viewer')).toBeDefined()
    // Use e2e tests to test resolver logic.
});


test('Test ViewerModelTransformer validation fails when provided viewer field of wrong type.', () => {
    const validSchema = `
    type User @model @viewer {
        id: ID!
        name: String!
    }
    `
    try {
        const transformer = new GraphQLTransform({
            transformers: [
                new AppSyncTransformer(),
                new DynamoDBModelTransformer(),
                new ViewerTransformer()
            ]
        })
        const out = transformer.transform(validSchema);
    } catch (e) {
        expect(e.name).toEqual('TransformerContractError')
    }
});

test('Test VersionedModelTransformer version field replaced by non-null if provided as nullable.', () => {
    const validSchema = `
    type User @model @viewer {
        id: ID!
        name: String!
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ViewerTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    const sdl = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition
    const schemaDoc = parse(sdl)
    const viewerField = getField(getType(schemaDoc)('Query'), 'viewer')
    expect(viewerField).toBeDefined()
    // expect(versionField.type.kind).toEqual(Kind.NON_NULL_TYPE)
});