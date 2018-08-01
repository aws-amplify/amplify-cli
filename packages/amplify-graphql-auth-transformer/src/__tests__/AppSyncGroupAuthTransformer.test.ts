import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'amplify-graphql-transform'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from 'amplify-graphql-dynamodb-transformer'
import { AppSyncAuthTransformer } from '../AppSyncAuthTransformer'

test('Test AppSyncAuthTransformer validation happy case w/ static groups', () => {
    const validSchema = `
    type Post @model @auth(allow: groups, groups: ["Admin", "Dev"]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(out.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test AppSyncAuthTransformer validation happy case w/ dynamic groups', () => {
    const validSchema = `
    type Post @model @auth(allow: groups, groupsField: "groups") {
        id: ID!
        title: String!
        groups: [String]
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(out.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test AppSyncAuthTransformer validation happy case w/ dynamic group', () => {
    const validSchema = `
    type Post @model @auth(allow: groups, groupsField: "groups") {
        id: ID!
        title: String!
        group: String
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncDynamoDBTransformer(),
            new AppSyncAuthTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    console.log(JSON.stringify(out, null, 4))
    expect(out).toBeDefined()
    expect(out.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test AppSyncAuthTransformer validation @auth on non @model. Should fail.', () => {
    try {
        const validSchema = `
            type Post @auth(allow: groups, groupsField: "groups") {
                id: ID!
                title: String!
                group: String
                createdAt: String
                updatedAt: String
            }
        `
        const transformer = new GraphQLTransform({
            transformers: [
                new AppSyncDynamoDBTransformer(),
                new AppSyncAuthTransformer()
            ]
        })
        const out = transformer.transform(validSchema)
        expect(true).toEqual(false)
    } catch (e) {
        expect(e).toBeDefined()
    }
});