export class ResourceConstants {

    public static NONE = "NONE"

    public static readonly RESOURCES = {
        // AppSync
        GraphQLAPILogicalID: 'GraphQLAPI',
        GraphQLSchemaLogicalID: 'GraphQLSchema',
        APIKeyLogicalID: 'GraphQLAPIKey',

        // Elasticsearch
        ElasticsearchAccessIAMRoleLogicalID: 'ElasticsearchAccessIAMRole',
        ElasticsearchDomainLogicalID: 'ElasticsearchDomain',
        ElasticsearchStreamingLambdaIAMRoleLogicalID: 'ElasticsearchStreamingLambdaIAMRole',
        ElasticsearchStreamingLambdaFunctionLogicalID: 'ElasticsearchStreamingLambdaFunction',
        ElasticsearchDataSourceLogicalID: 'ElasticsearchDataSource',

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

        // Elasticsearch
        ElasticsearchDomainName: 'ElasticsearchDomainName',
        ElasticsearchAccessIAMRoleName: 'ElasticsearchAccessIAMRoleName',
        ElasticsearchDebugStreamingLambda: 'ElasticsearchDebugStreamingLambda',
        ElasticsearchStreamingIAMRoleName: 'ElasticsearchStreamingIAMRoleName',
        ElasticsearchStreamingFunctionName: 'ElasticsearchStreamingFunctionName',
        ElasticsearchInstanceCount: 'ElasticsearchInstanceCount',
        ElasticsearchInstanceType: 'ElasticsearchInstanceType',
        ElasticsearchEBSVolumeGB: 'ElasticsearchEBSVolumeGB',
        ElasticsearchStreamingLambdaHandlerName: 'ElasticsearchStreamingLambdaHandlerName',
        ElasticsearchStreamingLambdaRuntime: 'ElasticsearchStreamingLambdaRuntime',

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