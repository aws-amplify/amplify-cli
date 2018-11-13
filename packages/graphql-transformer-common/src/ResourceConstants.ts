export class ResourceConstants {

    public static NONE = "NONE"

    public static readonly RESOURCES = {
        // AppSync
        GraphQLAPILogicalID: 'GraphQLAPI',
        GraphQLSchemaLogicalID: 'GraphQLSchema',
        APIKeyLogicalID: 'GraphQLAPIKey',

        // ElasticSearch
        ElasticSearchAccessIAMRoleLogicalID: 'ElasticSearchAccessIAMRole',
        ElasticSearchDomainLogicalID: 'ElasticSearchDomain',
        ElasticSearchStreamingLambdaIAMRoleLogicalID: 'ElasticSearchStreamingLambdaIAMRole',
        ElasticSearchStreamingLambdaFunctionLogicalID: 'ElasticSearchStreamingLambdaFunction',
        ElasticSearchDataSourceLogicalID: 'ElasticSearchDataSource',

        // Auth
        AuthCognitoUserPoolLogicalID: 'AuthCognitoUserPool',
        AuthCognitoUserPoolNativeClientLogicalID: 'AuthCognitoUserPoolNativeClient',
        AuthCognitoUserPoolJSClientLogicalID: 'AuthCognitoUserPoolJSClient',
    }
    public static PARAMETERS = {
        // cli
        Env: 'env',

        // AppSync
        AppSyncApiName: 'AppSyncApiName',

        // DynamoDB
        DynamoDBModelTableReadIOPS: 'DynamoDBModelTableReadIOPS',
        DynamoDBModelTableWriteIOPS: 'DynamoDBModelTableWriteIOPS',

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
        ElasticSearchStreamingLambdaHandlerName: 'ElasticSearchStreamingLambdaHandlerName',
        ElasticSearchStreamingLambdaRuntime: 'ElasticSearchStreamingLambdaRuntime',

        // Auth
        AuthCognitoUserPoolId: 'AuthCognitoUserPoolId',
        AuthCognitoUserPoolName: 'AuthCognitoUserPoolName',
        AuthCognitoUserPoolMobileClientName: 'AuthCognitoUserPoolMobileClientName',
        AuthCognitoUserPoolJSClientName: 'AuthCognitoUserPoolJSClientName',
        AuthCognitoUserPoolRefreshTokenValidity: 'AuthCognitoUserPoolRefreshTokenValidity'
    }
    public static MAPPINGS = {}
    public static CONDITIONS = {
        // Environment
        HasEnvironmentParameter: 'HasEnvironmentParameter',

        // Auth
        AuthShouldCreateUserPool: 'AuthShouldCreateUserPool'
    }
    public static OUTPUTS = {

        // AppSync
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput',
        GraphQLAPIIdOutput: 'GraphQLAPIIdOutput',

        // Elasticsearch
        ElasticSearchStreamingLambdaIAMRoleArn: 'ElasticSearchStreamingLambdaIAMRoleArn',
        ElasticSearchAccessIAMRoleArn: 'ElasticSearchAccessIAMRoleArn',

        // Auth
        AuthCognitoUserPoolIdOutput: 'AuthCognitoUserPoolIdOutput',
        AuthCognitoUserPoolNativeClientOutput: 'AuthCognitoUserPoolNativeClientId',
        AuthCognitoUserPoolJSClientOutput: 'AuthCognitoUserPoolJSClientId'
    }
    public static METADATA = {}

    public static readonly SNIPPETS = {
        AuthCondition: "authCondition",
        VersionedCondition: "versionedCondition",
        IsDynamicGroupAuthorizedVariable: "isDynamicGroupAuthorized",
        IsLocalDynamicGroupAuthorizedVariable: "isLocalDynamicGroupAuthorized",
        IsStaticGroupAuthorizedVariable: "isStaticGroupAuthorized",
        IsOwnerAuthorizedVariable: "isOwnerAuthorized",
        IsLocalOwnerAuthorizedVariable: "isLocalOwnerAuthorized"
    }
}