export class ResourceConstants {

    public static NONE = "NONE"

    public static readonly ENVIRONMENT_CONTEXT_KEYS = {


        // Aurora Serverless Imports
        RDSRegion: 'rdsRegion',
        RDSClusterIdentifier: 'rdsClusterIdentifier',
        RDSSecretStoreArn: 'rdsSecretStoreArn',
        RDSDatabaseName: 'rdsDatabaseName'
    }

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

        // Local. Try not to collide with model data sources.
        NoneDataSource: 'NoneDataSource',

        // Auth
        AuthCognitoUserPoolLogicalID: 'AuthCognitoUserPool',
        AuthCognitoUserPoolNativeClientLogicalID: 'AuthCognitoUserPoolNativeClient',
        AuthCognitoUserPoolJSClientLogicalID: 'AuthCognitoUserPoolJSClient',

        // Relational Database
        RelationalDatabaseDataSource: 'RelationalDatabaseDataSource',
        RelationalDatabaseAccessRole: 'RelationalDatabaseAccessRole',
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
        DynamoDBEnablePointInTimeRecovery: 'DynamoDBEnablePointInTimeRecovery',

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
        AuthCognitoUserPoolRefreshTokenValidity: 'AuthCognitoUserPoolRefreshTokenValidity',

        // Aurora Serverless
        rdsRegion: 'rdsRegion',
        rdsClusterIdentifier: 'rdsClusterIdentifier',
        rdsSecretStoreArn: 'rdsSecretStoreArn',
        rdsDatabaseName: 'rdsDatabaseName'
    }
    public static MAPPINGS = {}
    public static CONDITIONS = {
        // Environment
        HasEnvironmentParameter: 'HasEnvironmentParameter',

        // DynamoDB
        ShouldUsePayPerRequestBilling: 'ShouldUsePayPerRequestBilling',
        ShouldUsePointInTimeRecovery: 'ShouldUsePointInTimeRecovery',

        // Auth
        ShouldCreateAPIKey: 'ShouldCreateAPIKey',
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
        ElasticsearchDomainArn: 'ElasticsearchDomainArn',
        ElasticsearchDomainEndpoint: 'ElasticsearchDomainEndpoint',

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
