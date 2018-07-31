export declare class ResourceConstants {
    static readonly RESOURCES: {
        GraphQLAPILogicalID: string;
        GraphQLSchemaLogicalID: string;
        APIKeyLogicalID: string;
        DynamoDBModelTableLogicalID: string;
        DynamoDBModelTableAccessIAMRoleLogicalID: string;
        DynamoDBModelTableDataSourceLogicalID: string;
        ElasticSearchAccessIAMRoleLogicalID: string;
        ElasticSearchDomainLogicalID: string;
        ElasticSearchStreamingLambdaIAMRoleLogicalID: string;
        ElasticSearchStreamingLambdaFunctionLogicalID: string;
        ElasticSearchStreamingLambdaEventSourceMappingLogicalID: string;
        ElasticSearchDataSourceLogicalID: string;
    };
    static PARAMETERS: {
        AppSyncApiName: string;
        DynamoDBModelTableName: string;
        DynamoDBModelTableReadIOPS: string;
        DynamoDBModelTableWriteIOPS: string;
        DynamoDBModelTableAccessIAMRoleName: string;
        ElasticSearchDomainName: string;
        ElasticSearchAccessIAMRoleName: string;
        ElasticSearchDebugStreamingLambda: string;
        ElasticSearchStreamingIAMRoleName: string;
        ElasticSearchStreamingFunctionName: string;
        ElasticSearchInstanceCount: string;
        ElasticSearchInstanceType: string;
        ElasticSearchEBSVolumeGB: string;
        ElasticSearchStreamingLambdaCodeS3Bucket: string;
        ElasticSearchStreamingLambdaCodeS3Key: string;
        ElasticSearchStreamingLambdaCodeS3Version: string;
        ElasticSearchStreamingLambdaHandlerName: string;
        ElasticSearchStreamingLambdaRuntime: string;
    };
    static MAPPINGS: {};
    static CONDITIONS: {};
    static OUTPUTS: {
        GraphQLAPIEndpointOutput: string;
        GraphQLAPIApiKeyOutput: string;
    };
    static METADATA: {};
}
