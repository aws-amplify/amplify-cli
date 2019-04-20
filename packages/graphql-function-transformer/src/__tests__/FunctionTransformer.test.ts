import {
    ObjectTypeDefinitionNode, parse, DocumentNode,
    Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform, { Transformer } from 'graphql-transformer-core'
import { FunctionTransformer } from '../FunctionTransformer'

test('FunctionTransformer should add a datasource, IAM role and a resolver resources', () => {
    const validSchema = `
    type Query {
        echo(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })

    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    // EchofunctionLambdaDataSource, EchofunctionLambdaDataSourceRole, QueryEchoResolver, GraphQLSchema
    expect(Object.keys(out.rootStack.Resources).length).toEqual(4)

    let expectedLambdaArn = 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction-${env}'
    // datasource
    let datasourceResource = out.rootStack.Resources.EchofunctionLambdaDataSource
    expect(datasourceResource).toBeDefined()
    expect(
        datasourceResource.Properties.LambdaConfig.LambdaFunctionArn['Fn::Sub'][0],
    ).toEqual(expectedLambdaArn)

    // IAM role
    let iamRoleResource = out.rootStack.Resources.EchofunctionLambdaDataSourceRole
    expect(iamRoleResource).toBeDefined()
    expect(
        iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
    ).toEqual('appsync.amazonaws.com')
    expect(
        iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Action
    ).toEqual('sts:AssumeRole')
    expect(
        iamRoleResource.Properties.Policies[0].PolicyDocument.Statement[0].Action[0]
    ).toEqual('lambda:invokeFunction')
    expect(
        iamRoleResource.Properties.Policies[0].PolicyDocument.Statement[0].Resource[0]['Fn::Sub'][0]
    ).toEqual(expectedLambdaArn)
    
    // Resolver
    let resolverResource = out.rootStack.Resources.QueryEchoResolver
    expect(resolverResource).toBeDefined()
    expect(resolverResource.Properties.FieldName).toEqual("echo")
    expect(resolverResource.Properties.TypeName).toEqual("Query")
})

test('two @function directives for the same lambda should produce a single datasource, single role and two resolvers', () => {
    const validSchema = `
    type Query {
        echo(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}") 
        magic(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })

    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(Object.keys(out.rootStack.Resources).length).toEqual(5)
    expect(out.rootStack.Resources.EchofunctionLambdaDataSource).toBeDefined()
    expect(out.rootStack.Resources.EchofunctionLambdaDataSourceRole).toBeDefined()
    expect(out.rootStack.Resources.QueryEchoResolver).toBeDefined()
    expect(out.rootStack.Resources.QueryMagicResolver).toBeDefined()
})

test('two @function directives for the same field should throw SchemaValidationError', () => {
    const validSchema = `
    type Query {
        echo(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}") @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })  
    try { 
        transformer.transform(validSchema)
        fail("SchemaValidationError is expected to be thrown")
    } catch (error) {
        expect(error.name).toEqual("SchemaValidationError")
    }
})

test('@function directive applied to Object should throw SchemaValidationError', () => {
    const validSchema = `
    type Query @function(name: "echofunction-\${env}") {
        echo(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })  
    try { 
        transformer.transform(validSchema)
        fail("SchemaValidationError is expected to be thrown")
    } catch (error) {
        expect(error.name).toEqual("SchemaValidationError")
    }
})

test('@function directive applied with @http directive should throw InvalidDirectiveError', () => {
    let validSchema = `
    type Query {
        echo(msgP1: String, msgP2: String): String @function(name: "echofunction-\${env}") @http(method: GET, url: "https://jsonplaceholder.typicode.com/posts/1")
    }
    `

    let transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer(),
            new Transformer(
                'HttpTransformer',
                `
                directive @http(
                    method: HttpMethod = GET,
                    url: String!
                ) on FIELD_DEFINITION
                enum HttpMethod {
                    GET
                    POST
                    PUT
                    DELETE
                    PATCH
                }
                `)
        ]
    })  
    try { 
        transformer.transform(validSchema)
        fail("InvalidDirectiveError is expected to be thrown")
    } catch (error) {
        expect(error.name).toEqual("InvalidDirectiveError")
    }
})

test('@function directive applied with @connection directive should throw InvalidDirectiveError', () => {
    let validSchema = `
    type Post {
        id: ID!
        title: String!
        blog: Blog @connection(name: "BlogPosts")
    }
    type Blog {
        id: ID!
        name: String!
        posts: [Post] @connection(name: "BlogPosts") @function(name: "echofunction-\${env}")
    }
    `
    
    let transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer(),
            new Transformer(
                'ModelConnectionTransformer',
                `directive @connection(name: String, keyField: String, sortField: String) on FIELD_DEFINITION`
            )
        ]
    })  
    try { 
        transformer.transform(validSchema)
        fail("InvalidDirectiveError is expected to be thrown")
    } catch (error) {
        expect(error.name).toEqual("InvalidDirectiveError")
    }
})