import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, TypeDefinitionNode, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import { ResourceConstants, ModelResourceIDs, ResolverResourceIDs } from 'graphql-transformer-common'
import { AppSyncVersionedTransformer } from '../AppSyncVersionedTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import AppSyncDynamoDBTransformer from 'graphql-dynamodb-transformer'

test('Test AppSyncVersionedTransformer validation happy case', () => {
    const validSchema = `
    type Post @model @versioned {
        id: ID!
        title: String!
        version: Int!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer(),
            new AppSyncVersionedTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    // tslint:disable-next-line
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)
    const getInputType = (name: string): InputObjectTypeDefinitionNode => 
        schemaDoc.definitions.find(d => d.kind !== Kind.SCHEMA_DEFINITION ? d.name.value === name : false) as InputObjectTypeDefinitionNode
    const getInputField = (input: InputObjectTypeDefinitionNode, field: string) => input.fields.find(f => f.name.value === field)
    expect(out).toBeDefined()
    expect(getInputField(getInputType('CreatePostInput'), 'version')).toBeUndefined()
    expect(getInputField(getInputType('UpdatePostInput'), 'expectedVersion')).toBeDefined()
    expect(getInputField(getInputType('DeletePostInput'), 'expectedVersion')).toBeDefined()
    // Use e2e tests to test resolver logic.
});