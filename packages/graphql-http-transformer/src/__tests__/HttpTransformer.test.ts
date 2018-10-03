import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants, ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import { HttpTransformer } from '../HttpTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'
import Resource from 'cloudform/types/resource';

test('Test HttpTransformer simple one to many happy case', () => {
    const validSchema = `
    type Comment {
        id: ID!
        content: String @http(method: POST, url: "http://www.api.com/ping")
        content2: String @http(method: PUT, url: "http://www.api.com/ping")
        more: String @http(url: "http://api.com/ping/me/2")
        evenMore: String @http(method: DELETE, url: "http://www.google.com/query/:id")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new HttpTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    // expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'content')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'content2')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'more')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'evenMore')]).toBeTruthy()
});
