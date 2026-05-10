import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Backend } from '../../backend';
const branchName = process.env.AWS_BRANCH ?? "sandbox";
const projectName = "financetracker";
export class Customresolver extends Construct {
    constructor(scope: Construct, id: string, backend: Backend) {
        super(scope, id);
        // Gen1 pattern: reference the GraphQL API ID using cdk.Fn.ref
        // This is the exact pattern that breaks during Gen2 migration
        const apiId = backend.data.resources.cfnResources.cfnGraphqlApi.attrApiId;
        // Create IAM role for the DynamoDB data source
        const dataSourceRole = new iam.Role(this, 'TransactionsByCategoryDSRole', {
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
            roleName: `TransByCatDSRole-${branchName}`,
        });
        // Grant DynamoDB access to the role
        dataSourceRole.addToPolicy(new iam.PolicyStatement({
            actions: [
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:GetItem',
            ],
            resources: [
                cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/Transaction-*'),
            ],
        }));
        // Create a DynamoDB data source for the custom resolver
        // Using Gen1 CfnDataSource pattern (low-level CloudFormation)
        const dataSource = new cdk.aws_appsync.CfnDataSource(this, 'TransactionsByCategoryDS', {
            apiId: apiId,
            name: 'TransactionsByCategoryDataSource',
            type: 'AMAZON_DYNAMODB',
            dynamoDbConfig: {
                tableName: cdk.Fn.sub('Transaction-${apiId}-${env}', {
                    apiId: apiId,
                    env: branchName,
                }),
                awsRegion: cdk.Fn.ref('AWS::Region'),
            },
            serviceRoleArn: dataSourceRole.roleArn,
        });
        // Request mapping template - VTL resolver for querying by category
        const requestTemplate = `
## Custom VTL resolver for getTransactionsByCategory
#set($limit = $util.defaultIfNull($ctx.args.limit, 20))
{
  "version": "2018-05-29",
  "operation": "Scan",
  "filter": {
    "expression": "category = :category",
    "expressionValues": {
      ":category": $util.dynamodb.toDynamoDBJson($ctx.args.category)
    }
  },
  "limit": $limit,
  "consistentRead": true
}`;
        // Response mapping template
        const responseTemplate = `
## Return the results as a TransactionConnection
{
  "items": $util.toJson($ctx.result.items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}`;
        // Create the resolver using Gen1 CfnResolver pattern
        const resolver = new cdk.aws_appsync.CfnResolver(this, 'GetTransactionsByCategoryResolver', {
            apiId: apiId,
            typeName: 'Query',
            fieldName: 'getTransactionsByCategory',
            dataSourceName: dataSource.attrName,
            requestMappingTemplate: requestTemplate,
            responseMappingTemplate: responseTemplate,
        });
        resolver.addDependency(dataSource);
        // Output the resolver info
        new cdk.CfnOutput(this, 'ResolverArn', {
            value: resolver.attrResolverArn,
            description: 'ARN of the custom getTransactionsByCategory resolver',
        });
        new cdk.CfnOutput(this, 'DataSourceName', {
            value: dataSource.attrName,
            description: 'Name of the custom DynamoDB data source',
        });
    }
}
