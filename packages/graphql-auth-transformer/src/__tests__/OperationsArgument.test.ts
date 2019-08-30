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
    expect(out.resolvers['Query.getPost.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Query.listPosts.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(out.resolvers['Query.listPosts.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.createPost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.updatePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.deletePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.deletePost.req.vtl']).toMatchSnapshot();
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
    expect(out.resolvers['Query.getPost.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Query.listPosts.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(out.resolvers['Query.listPosts.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.createPost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.createPost.req.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.updatePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.updatePost.req.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Mutation.deletePost.req.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Mutation.deletePost.req.vtl']).toMatchSnapshot();
});

test('Test that checks subscription resolvers are generated with auth logic', () => {
    const validSchema = `
    type Salary @model
    @auth( rules: [
        {allow: owner},
        {allow: groups, groups: ["Admin"]}]){
       id: ID!
       wage: Int
       owner: String
   }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    // expect to generate subcriptions resolvers
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Subscription.onCreateSalary.res.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onCreateSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onDeleteSalary.res.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onDeleteSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onUpdateSalary.res.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onUpdateSalary.res.vtl']).toMatchSnapshot();
});

test('Test that checks subscription resolvers are created without auth logic', () => {
    const validSchema = `
    type Salary @model(
        subscriptions: {
            level: public
        }) @auth( rules: [
        {allow: owner},
        {allow: groups, groups: ["Admin"]}]){
       id: ID!
       wage: Int
       owner: String
   }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    // expect to generate subcriptions resolvers
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Subscription.onCreateSalary.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onCreateSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onDeleteSalary.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onDeleteSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onUpdateSalary.res.vtl']
    ).not.toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onUpdateSalary.res.vtl']).toMatchSnapshot();
});

test('Test that subscriptions are only generated if the respective mutation operation exists', () => {
    const validSchema = `
    type Salary @model(
        mutations: {
            create: "makeIT",
            update: "updateIT",
        })@auth(
            rules: [
                {allow: owner},
                {allow: groups, groups: ["Moderator"], operations: [create]}
            ]){
        id: ID!
        wage: Int
        owner: String
     }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({authMode: 'AMAZON_COGNITO_USER_POOLS'})
        ]
    })
    const out = transformer.transform(validSchema)
    // expect to generate subscription resolvers for create and update only
    expect(out).toBeDefined()
    expect(
        out.rootStack.Resources[ResourceConstants.RESOURCES.GraphQLAPILogicalID].Properties.AuthenticationType
    ).toEqual('AMAZON_COGNITO_USER_POOLS')
    expect(
        out.resolvers['Subscription.onCreateSalary.res.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onCreateSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onUpdateSalary.res.vtl']
    ).toContain('Authorization rule:')
    expect(out.resolvers['Subscription.onUpdateSalary.res.vtl']).toMatchSnapshot();
    expect(
        out.resolvers['Subscription.onDeleteSalary.res.vtl']
    ).toBeUndefined()
})