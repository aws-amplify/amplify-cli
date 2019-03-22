import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
import { ModelAuthTransformer } from '../ModelAuthTransformer'

test('Test "read" auth operation', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"], operations: [read]}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Query.getPost.res.vtl']
    ).toContain('Authorization rule:')
    expect(
        out.resolvers['Query.listPosts.res.vtl']
    ).toContain('Authorization rule:')
});

test('Test "create", "update", "delete" auth operations', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"], operations: [create, update, delete]}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Query.getPost.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(
        out.resolvers['Query.listPosts.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.createPost.req.vtl']
    ).toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.updatePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.deletePost.req.vtl']
    ).toContain('Authorization rule:')
});

test('Test that operation overwrites queries in auth operations', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"], queries: [get, list], operations: [create, update, delete]}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Query.getPost.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(
        out.resolvers['Query.listPosts.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.createPost.req.vtl']
    ).toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.updatePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(
        out.resolvers['Mutation.deletePost.req.vtl']
    ).toContain('Authorization rule:')
});
