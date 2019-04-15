/**
 * Resource Constants that are specific to the Relation Database Transform
 */
export class ResourceConstants {

    public static readonly ENVIRONMENT_CONTEXT_KEYS = {
        // Aurora Serverless Imports
        RDSRegion: 'rdsRegion',
        RDSClusterIdentifier: 'rdsClusterIdentifier',
        RDSSecretStoreArn: 'rdsSecretStoreArn',
        RDSDatabaseName: 'rdsDatabaseName',
    }

    public static readonly RESOURCES = {
        // AppSync
        GraphQLAPILogicalID: 'GraphQLAPI',
        GraphQLSchemaLogicalID: 'GraphQLSchema',
        APIKeyLogicalID: 'GraphQLAPIKey',

        // Relational Database
        ResolverFileName: 'ResolverFileName',
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

        // Aurora Serverless
        rdsRegion: 'rdsRegion',
        rdsClusterIdentifier: 'rdsClusterIdentifier',
        rdsSecretStoreArn: 'rdsSecretStoreArn',
        rdsDatabaseName: 'rdsDatabaseName'
    }
}