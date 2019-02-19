export class ResourceConstants {

    public static NONE = "NONE"

    public static readonly RESOURCES = {
        // AppSync
        GraphQLAPILogicalID: 'GraphQLAPI',
        GraphQLSchemaLogicalID: 'GraphQLSchema',
        APIKeyLogicalID: 'GraphQLAPIKey',

        // Elasticsearch
        ElasticsearchAccessIAMRoleLogicalID: 'ElasticSearchAccessIAMRole',
        ElasticsearchDomainLogicalID: 'ElasticSearchDomain',
        ElasticsearchStreamingLambdaIAMRoleLogicalID: 'ElasticSearchStreamingLambdaIAMRole',
        ElasticsearchStreamingLambdaFunctionLogicalID: 'ElasticSearchStreamingLambdaFunction',
        ElasticsearchDataSourceLogicalID: 'ElasticSearchDataSource',

        // Auth
        AuthCognitoUserPoolLogicalID: 'AuthCognitoUserPool',
        AuthCognitoUserPoolNativeClientLogicalID: 'AuthCognitoUserPoolNativeClient',
        AuthCognitoUserPoolJSClientLogicalID: 'AuthCognitoUserPoolJSClient',
    }
    public static PARAMETERS = {
        // cli
        Env: 'env',
        S3DeploymentBucket: 'S3DeploymentBucket',
        S3DeploymentRootKey: 'S3DeploymentRootKey',

        // AppSync
        AppSyncApiName: 'AppSyncApiName',
        AppSyncApiId: 'AppSyncApiId',
        APIKeyExpirationEpoch: 'APIKeyExpirationEpoch',

        // DynamoDB
        DynamoDBBillingMode:   'DynamoDBBillingMode',
        DynamoDBModelTableReadIOPS: 'DynamoDBModelTableReadIOPS',
        DynamoDBModelTableWriteIOPS: 'DynamoDBModelTableWriteIOPS',

        // Elasticsearch
        ElasticsearchDomainName: 'ElasticSearchDomainName',
        ElasticsearchAccessIAMRoleName: 'ElasticSearchAccessIAMRoleName',
        ElasticsearchDebugStreamingLambda: 'ElasticSearchDebugStreamingLambda',
        ElasticsearchStreamingIAMRoleName: 'ElasticSearchStreamingIAMRoleName',
        ElasticsearchStreamingFunctionName: 'ElasticSearchStreamingFunctionName',
        ElasticsearchInstanceCount: 'ElasticSearchInstanceCount',
        ElasticsearchInstanceType: 'ElasticSearchInstanceType',
        ElasticsearchEBSVolumeGB: 'ElasticSearchEBSVolumeGB',
        ElasticsearchStreamingLambdaHandlerName: 'ElasticSearchStreamingLambdaHandlerName',
        ElasticsearchStreamingLambdaRuntime: 'ElasticSearchStreamingLambdaRuntime',

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

        // DynamoDB
        ShouldUsePayPerRequestBilling:   'ShouldUsePayPerRequestBilling',

        // Auth
        AuthShouldCreateUserPool: 'AuthShouldCreateUserPool',
        APIKeyExpirationEpochIsNotNegOne: 'APIKeyExpirationEpochIsNotNegOne',
        APIKeyExpirationEpochIsPositive: 'APIKeyExpirationEpochIsPositive',
    }
    public static OUTPUTS = {

        // AppSync
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput',
        GraphQLAPIIdOutput: 'GraphQLAPIIdOutput',

        // Elasticsearch
        ElasticsearchStreamingLambdaIAMRoleArn: 'ElasticsearchStreamingLambdaIAMRoleArn',
        ElasticsearchAccessIAMRoleArn: 'ElasticsearchAccessIAMRoleArn',

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