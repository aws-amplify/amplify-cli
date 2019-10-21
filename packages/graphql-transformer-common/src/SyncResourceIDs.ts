export class SyncResourceIDs {
  public static syncDataSourceID: string = 'DynamoDBGelatoDeltaSyncTable';
  public static syncTableName: string = 'gelato-delta-sync';
  public static syncPrimaryKey: string = 'ds_pk';
  public static syncRangeKey: string = 'ds_sk';
  public static syncIAMRoleID: string = 'DynamoDBDeltaSyncIAMRole';
  public static syncIAMRoleName: string = 'DeltaSyncIAMRoleName';
  public static syncFunctionID: string = 'delta-sync-lambda';
  public static syncFunctionRoleName: string = 'deltaSyncLambdaRole';
}
