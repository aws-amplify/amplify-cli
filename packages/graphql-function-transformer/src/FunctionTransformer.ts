import { 
    Transformer, gql, TransformerContext, getDirectiveArguments, TransformerContractError
} from 'graphql-transformer-core';
import { ResolverResourceIDs, FunctionResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode } from 'graphql';
import { AppSync, IAM, Fn } from 'cloudform-types'
import { lambdaArnResource } from './lambdaArns';

const FUNCTION_DIRECTIVE_STACK = 'FunctionDirectiveStack';

export default class FunctionTransformer extends Transformer {

    constructor() {
        super(
            'FunctionTransformer', 
            gql`directive @function(name: String!, region: String!) on FIELD_DEFINITION`
        )
    }

    /**
     * Add the required resources to invoke a lambda function for this field.
     */
    field = (parent: ObjectTypeDefinitionNode, definition: FieldDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const { name, region } = getDirectiveArguments(directive);
        if (!name) {
            throw new TransformerContractError(`Must supply a 'name' to @function.`)
        }

        // Add the iam role if it does not exist.
        const iamRoleKey = FunctionResourceIDs.FunctionIAMRoleID(name, region);
        if (!ctx.getResource(iamRoleKey)) {
            ctx.setResource(iamRoleKey, this.role(name, region));
            ctx.addToStackMapping(FUNCTION_DIRECTIVE_STACK, iamRoleKey);
        }

        // Add the data source if it does not exist.
        const lambdaDataSourceKey = FunctionResourceIDs.FunctionDataSourceID(name, region);
        if (!ctx.getResource(lambdaDataSourceKey)) {
            ctx.setResource(lambdaDataSourceKey, this.datasource(name, region));
            ctx.addToStackMapping(FUNCTION_DIRECTIVE_STACK, lambdaDataSourceKey);
        }

        // Add function that invokes the lambda function
        const functionConfigurationKey = FunctionResourceIDs.FunctionAppSyncFunctionConfigurationID(name, region);
        if (!ctx.getResource(functionConfigurationKey)) {
            ctx.setResource(functionConfigurationKey, this.function(name, region));
            ctx.addToStackMapping(FUNCTION_DIRECTIVE_STACK, functionConfigurationKey);
        }

        // Add resolver that invokes our function
        const typeName = parent.name.value;
        const fieldName = definition.name.value;
        const resolverKey = ResolverResourceIDs.ResolverResourceID(typeName, fieldName);
        if (!ctx.getResource(resolverKey)) {
            ctx.setResource(resolverKey, this.resolver(typeName, fieldName, name, region));
            ctx.addToStackMapping(FUNCTION_DIRECTIVE_STACK, resolverKey);
        }
    };

    /**
     * Create a role that allows our AppSync API to talk to our Lambda function.
     */
    role = (name: string, region: string): any => {
        return new IAM.Role({
            RoleName: Fn.If(
                ResourceConstants.CONDITIONS.HasEnvironmentParameter,
                Fn.Join('-', [
                    FunctionResourceIDs.FunctionIAMRoleID(name, region).slice(0, 28), // max of 64. 64-10-26-28 = 0
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
                    Fn.Ref(ResourceConstants.PARAMETERS.Env) // 10
                ]),
                Fn.Join('-', [
                    FunctionResourceIDs.FunctionIAMRoleID(name, region).slice(0, 38), // max of 64. 64-26-38 = 0
                    Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
                ])
            ),
            AssumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        "Service": "appsync.amazonaws.com"
                    },
                    Action: "sts:AssumeRole"
                }]
            },
            Policies: [{
                PolicyName: "InvokeLambdaFunction",
                PolicyDocument: {
                    Version: "2012-10-17",
                    Statement: [{
                        Effect: "Allow",
                        Action: [
                            "lambda:invokefunction"
                        ],
                        Resource: [lambdaArnResource(name, region)]
                    }]
                }
            }]
        })
    }

    /**
     * Creates a lambda data source that registers the lambda function and associated role.
     */
    datasource = (name: string, region: string): any => {
        return new AppSync.DataSource({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            Name: FunctionResourceIDs.FunctionDataSourceID(name, region),
            Type: "AWS_LAMBDA",
            ServiceRoleArn: Fn.GetAtt(FunctionResourceIDs.FunctionIAMRoleID(name, region), "Arn"),
            LambdaConfig: {
                LambdaFunctionArn: lambdaArnResource(name, region)
            }
        }).dependsOn(FunctionResourceIDs.FunctionIAMRoleID(name, region))
    }

    /**
     * Create a new pipeline function that calls out to the lambda function and returns the value.
     */
    function = (name: string, region: string): any => {
        return new AppSync.FunctionConfiguration({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            Name: FunctionResourceIDs.FunctionAppSyncFunctionConfigurationID(name, region),
            DataSourceName: FunctionResourceIDs.FunctionDataSourceID(name, region),
            FunctionVersion: "2018-05-29",
            RequestMappingTemplate: `{
                "version": "2018-05-29",
                "operation": "Invoke",
                "payload": $utils.toJson($ctx)
            }`,
            ResponseMappingTemplate: `$util.toJson($ctx.result)`
        }).dependsOn(FunctionResourceIDs.FunctionDataSourceID(name, region))
    }

    /**
     * Create a resolver of one that calls the "function" function.
     */
    resolver = (type: string, field: string, name: string, region?: string): any => {
        return new AppSync.Resolver({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            TypeName: type,
            FieldName: field,
            Kind: 'PIPELINE',
            PipelineConfig: {
                Functions: [
                    Fn.GetAtt(FunctionResourceIDs.FunctionAppSyncFunctionConfigurationID(name, region), "FunctionId")
                ]
            },
            RequestMappingTemplate: '{}',
            ResponseMappingTemplate: '$util.toJson($ctx.prev.result)'
        }).dependsOn(FunctionResourceIDs.FunctionAppSyncFunctionConfigurationID(name, region))
    }
}
