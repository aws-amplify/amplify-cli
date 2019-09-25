import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
import { ModelAuthTransformer } from '../ModelAuthTransformer'

test('Test ModelAuthTransformer validation happy case w/ static groups', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groups: ["Admin", "Dev"]}]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: "AMAZON_COGNITO_USER_POOLS"
                    },
                    additionalAuthenticationProviders: []
                }})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test ModelAuthTransformer validation happy case w/ dynamic groups', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groupsField: "groups"}]) {
        id: ID!
        title: String!
        groups: [String]
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: "AMAZON_COGNITO_USER_POOLS"
                    },
                    additionalAuthenticationProviders: []
                }})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test ModelAuthTransformer validation happy case w/ dynamic group', () => {
    const validSchema = `
    type Post @model @auth(rules: [{allow: groups, groupsField: "group"}]) {
        id: ID!
        title: String!
        group: String
        createdAt: String
        updatedAt: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: "AMAZON_COGNITO_USER_POOLS"
                    },
                    additionalAuthenticationProviders: []
                }})
        ]
    })
    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
});

test('Test ModelAuthTransformer validation @auth on non @model. Should fail.', () => {
    try {
        const validSchema = `
            type Post @auth(rules: [{allow: groups, groupsField: "groups"}]) {
                id: ID!
                title: String!
                group: String
                createdAt: String
                updatedAt: String
            }
        `
        const transformer = new GraphQLTransform({
            transformers: [
                new DynamoDBModelTransformer(),
                new ModelAuthTransformer({
                    authConfig: {
                        defaultAuthentication: {
                            authenticationType: "AMAZON_COGNITO_USER_POOLS"
                        },
                        additionalAuthenticationProviders: []
                    }})
            ]
        })
        const out = transformer.transform(validSchema)
        expect(true).toEqual(false)
    } catch (e) {
        expect(e).toBeDefined()
    }
});

test('Test for dynamic group auth with custom token', () => {
    const validSchema = `
    type Todo @model
        @auth(
            rules: [
                { allow: groups, groupsField: "groups", groupClaim: "groups" }
            ])
    {
        id: ID!
        groups: String
        content: String
    }`

    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: "AMAZON_COGNITO_USER_POOLS"
                    },
                    additionalAuthenticationProviders: []
                }
            })
        ]
    })

    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    // check the mutation operations to contain identityClaim from custom value in jwt
    expect(
        out.resolvers['Mutation.createTodo.req.vtl']
    ).toContain('#set( $userGroups = $util.defaultIfNull($ctx.identity.claims.get("groups"), []) )')
    expect(
        out.resolvers['Mutation.updateTodo.req.vtl']
    ).toContain('#set( $userGroups = $util.defaultIfNull($ctx.identity.claims.get("groups"), []) )')
    expect(
        out.resolvers['Mutation.deleteTodo.req.vtl']
    ).toContain('#set( $userGroups = $util.defaultIfNull($ctx.identity.claims.get("groups"), []) )')
})
