import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import { ResourceConstants } from 'graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from 'graphql-dynamodb-transformer'
import { AppSyncAuthTransformer } from '../AppSyncAuthTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test AppSyncAuthTransformer validation happy case', () => {
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
            new AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(out.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS')
});