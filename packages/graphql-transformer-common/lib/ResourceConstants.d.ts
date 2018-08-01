export declare class ResourceConstants {
    static NONE: string;
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
        AuthCognitoUserPoolLogicalID: string;
        AuthCognitoUserPoolNativeClientLogicalID: string;
        AuthCognitoUserPoolJSClientLogicalID: string;
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
        AuthCognitoUserPoolId: string;
        AuthCognitoUserPoolName: string;
        AuthCognitoUserPoolMobileClientName: string;
        AuthCognitoUserPoolJSClientName: string;
        AuthCognitoUserPoolRefreshTokenValidity: string;
    };
    static MAPPINGS: {};
    static CONDITIONS: {
        AuthShouldCreateUserPool: string;
    };
    static OUTPUTS: {
        GraphQLAPIEndpointOutput: string;
        GraphQLAPIApiKeyOutput: string;
        ElasticSearchStreamingLambdaIAMRoleArn: string;
        ElasticSearchAccessIAMRoleArn: string;
        AuthCognitoUserPoolIdOutput: string;
        AuthCognitoUserPoolNativeClientOutput: string;
        AuthCognitoUserPoolJSClientOutput: string;
    };
    static METADATA: {};
    static readonly SNIPPETS: {
        AuthCondition: string;
    };
}
