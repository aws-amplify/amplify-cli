"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResourceConstants = /** @class */ (function () {
    function ResourceConstants() {
    }
    ResourceConstants.NONE = "NONE";
    ResourceConstants.RESOURCES = {
        // AppSync
        GraphQLAPILogicalID: 'GraphQLAPI',
        GraphQLSchemaLogicalID: 'GraphQLSchema',
        APIKeyLogicalID: 'GraphQLAPIKey',
        // DynamoDB
        DynamoDBModelTableLogicalID: 'DynamoDBModelTable',
        DynamoDBModelTableAccessIAMRoleLogicalID: 'DynamoDBModelTableAccessIAMRole',
        DynamoDBModelTableDataSourceLogicalID: 'DynamoDBModelTableDataSource',
        // ElasticSearch
        ElasticSearchAccessIAMRoleLogicalID: 'ElasticSearchAccessIAMRole',
        ElasticSearchDomainLogicalID: 'ElasticSearchDomain',
        ElasticSearchStreamingLambdaIAMRoleLogicalID: 'ElasticSearchStreamingLambdaIAMRole',
        ElasticSearchStreamingLambdaFunctionLogicalID: 'ElasticSearchStreamingLambdaFunction',
        ElasticSearchStreamingLambdaEventSourceMappingLogicalID: 'ElasticSearchStreamingLambdaEventSourceMapping',
        ElasticSearchDataSourceLogicalID: 'ElasticSearchDataSource',
        // Auth
        AuthCognitoUserPoolLogicalID: 'AuthCognitoUserPool',
        AuthCognitoUserPoolNativeClientLogicalID: 'AuthCognitoUserPoolNativeClient',
        AuthCognitoUserPoolJSClientLogicalID: 'AuthCognitoUserPoolJSClient'
    };
    ResourceConstants.PARAMETERS = {
        // AppSync
        AppSyncApiName: 'AppSyncApiName',
        // DynamoDB
        DynamoDBModelTableName: 'DynamoDBModelTableName',
        DynamoDBModelTableReadIOPS: 'DynamoDBModelTableReadIOPS',
        DynamoDBModelTableWriteIOPS: 'DynamoDBModelTableWriteIOPS',
        DynamoDBModelTableAccessIAMRoleName: 'DynamoDBModelTableAccessIAMRoleName',
        // ElasticSearch
        ElasticSearchDomainName: 'ElasticSearchDomainName',
        ElasticSearchAccessIAMRoleName: 'ElasticSearchAccessIAMRoleName',
        ElasticSearchDebugStreamingLambda: 'ElasticSearchDebugStreamingLambda',
        ElasticSearchStreamingIAMRoleName: 'ElasticSearchStreamingIAMRoleName',
        ElasticSearchStreamingFunctionName: 'ElasticSearchStreamingFunctionName',
        ElasticSearchInstanceCount: 'ElasticSearchInstanceCount',
        ElasticSearchInstanceType: 'ElasticSearchInstanceType',
        ElasticSearchEBSVolumeGB: 'ElasticSearchEBSVolumeGB',
        ElasticSearchStreamingLambdaCodeS3Bucket: 'ElasticSearchStreamingLambdaCodeS3Bucket',
        ElasticSearchStreamingLambdaCodeS3Key: 'ElasticSearchStreamingLambdaCodeS3Key',
        ElasticSearchStreamingLambdaCodeS3Version: 'ElasticSearchStreamingLambdaCodeS3Version',
        ElasticSearchStreamingLambdaHandlerName: 'ElasticSearchStreamingLambdaHandlerName',
        ElasticSearchStreamingLambdaRuntime: 'ElasticSearchStreamingLambdaRuntime',
        // Auth
        AuthCognitoUserPoolId: 'AuthCognitoUserPoolId',
        AuthCognitoUserPoolName: 'AuthCognitoUserPoolName',
        AuthCognitoUserPoolMobileClientName: 'AuthCognitoUserPoolMobileClientName',
        AuthCognitoUserPoolJSClientName: 'AuthCognitoUserPoolJSClientName',
        AuthCognitoUserPoolRefreshTokenValidity: 'AuthCognitoUserPoolRefreshTokenValidity'
    };
    ResourceConstants.MAPPINGS = {};
    ResourceConstants.CONDITIONS = {
        // Auth
        AuthShouldCreateUserPool: 'AuthShouldCreateUserPool'
    };
    ResourceConstants.OUTPUTS = {
        // AppSync
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput',
        // Elasticsearch
        ElasticSearchStreamingLambdaIAMRoleArn: 'ElasticSearchStreamingLambdaIAMRoleArn',
        ElasticSearchAccessIAMRoleArn: 'ElasticSearchAccessIAMRoleArn',
        // Auth
        AuthCognitoUserPoolIdOutput: 'AuthCognitoUserPoolIdOutput',
        AuthCognitoUserPoolNativeClientOutput: 'AuthCognitoUserPoolNativeClientId',
        AuthCognitoUserPoolJSClientOutput: 'AuthCognitoUserPoolJSClientId'
    };
    ResourceConstants.METADATA = {};
    ResourceConstants.SNIPPETS = {
        AuthCondition: "authCondition"
    };
    return ResourceConstants;
}());
exports.ResourceConstants = ResourceConstants;
//# sourceMappingURL=ResourceConstants.js.map