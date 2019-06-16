import GraphQLTransform, { Transformer } from 'graphql-transformer-core'
import FunctionTransformer from '../FunctionTransformer'

test('FunctionTransformer should add a datasource, IAM role and a resolver resources', () => {
    const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}")
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
    expect(Object.keys(out.stacks.FunctionDirectiveStack.Resources).length).toEqual(4)

    let expectedLambdaArn = 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction-${env}'
    // datasource
    let datasourceResource = out.stacks.FunctionDirectiveStack.Resources.EchofunctionLambdaDataSource
    expect(datasourceResource).toBeDefined()
    expect(
        datasourceResource.Properties.LambdaConfig.LambdaFunctionArn['Fn::If'][1]['Fn::Sub'][0],
    ).toEqual(expectedLambdaArn)

    // IAM role
    let iamRoleResource = out.stacks.FunctionDirectiveStack.Resources.EchofunctionLambdaDataSourceRole
    expect(iamRoleResource).toBeDefined()
    expect(
        iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
    ).toEqual('appsync.amazonaws.com')
    expect(
        iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Action
    ).toEqual('sts:AssumeRole')
    expect(
        iamRoleResource.Properties.Policies[0].PolicyDocument.Statement[0].Action[0]
    ).toEqual('lambda:InvokeFunction')
    expect(
        iamRoleResource.Properties.Policies[0].PolicyDocument.Statement[0].Resource['Fn::If'][1]['Fn::Sub'][0]
    ).toEqual(expectedLambdaArn)
    
    // Resolver
    let resolverResource = out.stacks.FunctionDirectiveStack.Resources.QueryechoResolver
    expect(resolverResource).toBeDefined()
    expect(resolverResource.Properties.FieldName).toEqual("echo")
    expect(resolverResource.Properties.TypeName).toEqual("Query")
    expect(resolverResource.Properties.Kind).toEqual('PIPELINE')
    expect(resolverResource.Properties.PipelineConfig.Functions.length).toEqual(1)
})

test('two @function directives for the same lambda should produce a single datasource, single role and two resolvers', () => {
    const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}") 
        magic(msg: String): String @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })

    const out = transformer.transform(validSchema)
    expect(out).toBeDefined()
    expect(Object.keys(out.stacks.FunctionDirectiveStack.Resources).length).toEqual(5)
    expect(out.stacks.FunctionDirectiveStack.Resources.EchofunctionLambdaDataSource).toBeDefined()
    expect(out.stacks.FunctionDirectiveStack.Resources.EchofunctionLambdaDataSourceRole).toBeDefined()
    expect(out.stacks.FunctionDirectiveStack.Resources.QueryechoResolver).toBeDefined()
    expect(out.stacks.FunctionDirectiveStack.Resources.QuerymagicResolver).toBeDefined()
})

test('two @function directives for the same field should be valid', () => {
    const validSchema = `
    type Query {
        echo(msg: String): String @function(name: "echofunction-\${env}") @function(name: "otherfunction")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })
    const out = transformer.transform(validSchema)
    let resolverResource = out.stacks.FunctionDirectiveStack.Resources.QueryechoResolver
    expect(resolverResource).toBeDefined()
    expect(resolverResource.Properties.FieldName).toEqual("echo")
    expect(resolverResource.Properties.TypeName).toEqual("Query")
    expect(resolverResource.Properties.PipelineConfig.Functions.length).toEqual(2)
    const otherFunctionIamResource = out.stacks.FunctionDirectiveStack.Resources.OtherfunctionLambdaDataSourceRole;
    expect(otherFunctionIamResource.Properties.Policies[0].PolicyDocument.Statement[0].Resource['Fn::If'][1]["Fn::Sub"][0]).toEqual('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:otherfunction');
    const echoFunctionIamResource = out.stacks.FunctionDirectiveStack.Resources.EchofunctionLambdaDataSourceRole;
    expect(echoFunctionIamResource.Properties.Policies[0].PolicyDocument.Statement[0].Resource['Fn::If'][1]["Fn::Sub"][0]).toEqual('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:echofunction-${env}');
    expect(echoFunctionIamResource.Properties.Policies[0].PolicyDocument.Statement[0].Resource['Fn::If'][1]["Fn::Sub"][1].env.Ref).toEqual('env');
})

test('@function directive applied to Object should throw SchemaValidationError', () => {
    const invalidSchema = `
    type Query @function(name: "echofunction-\${env}") {
        echo(msg: String): String @function(name: "echofunction-\${env}")
    }
    `

    const transformer = new GraphQLTransform({
        transformers: [
            new FunctionTransformer()
        ]
    })  
    try { 
        transformer.transform(invalidSchema)
        fail("SchemaValidationError is expected to be thrown")
    } catch (error) {
        expect(error.name).toEqual("SchemaValidationError")
    }
})
