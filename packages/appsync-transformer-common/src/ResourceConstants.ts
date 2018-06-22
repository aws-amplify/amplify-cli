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
    }
    public static PARAMETERS = {
        // AppSync
        AppSyncApiName: 'AppSyncApiName',

        // DynamoDB
        DynamoDBModelTableName: 'DynamoDBModelTableName',
        DynamoDBModelTableReadIOPS: 'DynamoDBModelTableReadIOPS',
        DynamoDBModelTableWriteIOPS: 'DynamoDBModelTableWriteIOPS',
        DynamoDBModelTableAccessIAMRoleName: 'DynamoDBModelTableAccessIAMRoleName'
    }
    public static MAPPINGS = {}
    public static CONDITIONS = {}
    public static OUTPUTS = {
        GraphQLAPIEndpointOutput: 'GraphQLAPIEndpointOutput',
        GraphQLAPIApiKeyOutput: 'GraphQLAPIKeyOutput'
    }
    public static METADATA = {}
}