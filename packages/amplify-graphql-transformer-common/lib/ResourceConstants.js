"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResourceConstants = /** @class */ (function () {
    function ResourceConstants() {
    }
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
        ElasticSearchDataSourceLogicalID: 'ElasticSearchDataSource'
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
        ElasticSearchStreamingLambdaRuntime: 'ElasticSearchStreamingLambdaRuntime'
    };
    ResourceConstants.MAPPINGS = {};
    ResourceConstants.CONDITIONS = {};
    ResourceConstants.OUTPUTS = {
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput'
    };
    ResourceConstants.METADATA = {};
    return ResourceConstants;
}());
exports.ResourceConstants = ResourceConstants;
//# sourceMappingURL=ResourceConstants.js.map