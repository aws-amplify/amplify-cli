export class ResourceConstants {
    public static readonly RESOURCES = {
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
    }
    public static PARAMETERS = {
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
    }
    public static MAPPINGS = {}
    public static CONDITIONS = {}
    public static OUTPUTS = {
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput'
    }
    public static METADATA = {}
}