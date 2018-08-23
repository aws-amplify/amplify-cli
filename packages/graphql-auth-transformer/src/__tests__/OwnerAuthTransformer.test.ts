import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
import { ModelAuthTransformer } from '../ModelAuthTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test ModelAuthTransformer validation happy case', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: owner}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(out.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS')
});